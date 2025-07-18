// backend/services/credit.service.js
const db = require("../db-init");

const createTransaction = (type, amount, description, date) => {
  const stmt = db.prepare(
    `INSERT INTO transactions (type, amount, description, date, paymentMethod, status)
     VALUES (?, ?, ?, ?, 'cash', 'cashed')`
  );
  const result = stmt.run(type, amount, description, date);
  return result.lastInsertRowid;
};

const deleteTransactionHelper = (id) => {
  if (id) {
    db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
  }
};

const getCreditWithDetails = (creditId) => {
  const credit = db.prepare("SELECT * FROM credits WHERE id = ?").get(creditId);
  if (!credit) return null;

  credit.payments = db
    .prepare("SELECT * FROM payments WHERE credit_id = ? ORDER BY date DESC")
    .all(credit.id);
  const totalPaidResult = db
    .prepare("SELECT SUM(amount) as total FROM payments WHERE credit_id = ?")
    .get(credit.id);
  credit.totalPaid = totalPaidResult?.total || 0;
  credit.remainingBalance = credit.amount - credit.totalPaid;
  credit.includeInTotals = credit.includeInTotals === 1;

  if (credit.totalPaid >= credit.amount) {
    credit.status = "paid";
  } else if (credit.totalPaid > 0) {
    credit.status = "partially-paid";
  } else {
    credit.status = "unpaid";
  }

  return credit;
};

const getCredits = () => {
  const credits = db.prepare("SELECT * FROM credits ORDER BY date DESC").all();
  return credits.map((credit) => getCreditWithDetails(credit.id));
};

const addCredit = (credit) => {
  const {
    personName,
    type,
    amount,
    description,
    date,
    dueDate,
    includeInTotals,
  } = credit;
  const addCreditAndTransaction = db.transaction(() => {
    let transactionId = null;
    if (includeInTotals) {
      const transactionType = type === "lent" ? "expense" : "income";
      const transactionDescription =
        type === "lent"
          ? `Credit given to ${personName}`
          : `Credit taken from ${personName}`;
      transactionId = createTransaction(
        transactionType,
        amount,
        transactionDescription,
        date
      );
    }

    const creditStmt = db.prepare(
      `INSERT INTO credits (personName, type, amount, description, date, dueDate, includeInTotals, transaction_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const creditResult = creditStmt.run(
      personName,
      type,
      amount,
      description,
      date,
      dueDate,
      includeInTotals ? 1 : 0,
      transactionId
    );
    return creditResult.lastInsertRowid;
  });

  const newCreditId = addCreditAndTransaction();
  return getCreditWithDetails(newCreditId);
};

const updateCredit = (credit) => {
  const stmt = db.prepare(
    `UPDATE credits
     SET personName = ?, type = ?, amount = ?, description = ?, date = ?, dueDate = ?, includeInTotals = ?
     WHERE id = ?`
  );
  stmt.run(
    credit.personName,
    credit.type,
    credit.amount,
    credit.description,
    credit.date,
    credit.dueDate,
    credit.includeInTotals ? 1 : 0,
    credit.id
  );
  return getCreditWithDetails(credit.id);
};

const deleteCredit = (id) => {
  const deleteCreditAndTransactions = db.transaction(() => {
    const credit = db
      .prepare("SELECT transaction_id FROM credits WHERE id = ?")
      .get(id);
    if (credit) {
      deleteTransactionHelper(credit.transaction_id);
    }
    const payments = db
      .prepare("SELECT transaction_id FROM payments WHERE credit_id = ?")
      .all(id);
    payments.forEach((p) => deleteTransactionHelper(p.transaction_id));

    db.prepare("DELETE FROM credits WHERE id = ?").run(id);
  });

  deleteCreditAndTransactions();
  return { success: true };
};

const toggleCreditInclusion = ({ credit_id, include }) => {
  const toggleInclusion = db.transaction(() => {
    const credit = db
      .prepare("SELECT * FROM credits WHERE id = ?")
      .get(credit_id);
    if (!credit) return;

    db.prepare("UPDATE credits SET includeInTotals = ? WHERE id = ?").run(
      include ? 1 : 0,
      credit_id
    );

    if (include) {
      if (!credit.transaction_id) {
        const transactionType = credit.type === "lent" ? "expense" : "income";
        const desc =
          credit.type === "lent"
            ? `Credit given to ${credit.personName}`
            : `Credit taken from ${credit.personName}`;
        const transId = createTransaction(
          transactionType,
          credit.amount,
          desc,
          credit.date
        );
        db.prepare("UPDATE credits SET transaction_id = ? WHERE id = ?").run(
          transId,
          credit_id
        );
      }
      const payments = db
        .prepare(
          "SELECT * FROM payments WHERE credit_id = ? AND transaction_id IS NULL"
        )
        .all(credit_id);
      for (const p of payments) {
        const transType = credit.type === "lent" ? "income" : "expense";
        const desc =
          credit.type === "lent"
            ? `Payment received from ${credit.personName}`
            : `Payment made to ${credit.personName}`;
        const transId = createTransaction(transType, p.amount, desc, p.date);
        db.prepare("UPDATE payments SET transaction_id = ? WHERE id = ?").run(
          transId,
          p.id
        );
      }
    } else {
      deleteTransactionHelper(credit.transaction_id);
      db.prepare("UPDATE credits SET transaction_id = NULL WHERE id = ?").run(
        credit_id
      );
      const payments = db
        .prepare("SELECT * FROM payments WHERE credit_id = ?")
        .all(credit_id);
      for (const p of payments) {
        deleteTransactionHelper(p.transaction_id);
      }
      db.prepare(
        "UPDATE payments SET transaction_id = NULL WHERE credit_id = ?"
      ).run(credit_id);
    }
  });

  toggleInclusion();
  return getCreditWithDetails(credit_id);
};

const addPayment = ({ credit_id, amount, date }) => {
  const addPaymentAndTransaction = db.transaction(() => {
    const credit = db
      .prepare("SELECT * FROM credits WHERE id = ?")
      .get(credit_id);
    if (!credit) throw new Error("Credit not found");

    let transactionId = null;
    if (credit.includeInTotals) {
      const transactionType = credit.type === "lent" ? "income" : "expense";
      const desc =
        credit.type === "lent"
          ? `Payment received from ${credit.personName}`
          : `Payment made to ${credit.personName}`;
      transactionId = createTransaction(transactionType, amount, desc, date);
    }

    const paymentStmt = db.prepare(
      "INSERT INTO payments (credit_id, amount, date, transaction_id) VALUES (?, ?, ?, ?)"
    );
    paymentStmt.run(credit_id, amount, date, transactionId);
  });

  addPaymentAndTransaction();
  return getCreditWithDetails(credit_id);
};

const deletePayment = ({ payment_id }) => {
  const deletePaymentAndTransaction = db.transaction(() => {
    const payment = db
      .prepare("SELECT * FROM payments WHERE id = ?")
      .get(payment_id);
    if (payment) {
      deleteTransactionHelper(payment.transaction_id);
      db.prepare("DELETE FROM payments WHERE id = ?").run(payment_id);
      return payment.credit_id;
    }
    return null;
  });

  const creditId = deletePaymentAndTransaction();
  if (creditId) {
    return getCreditWithDetails(creditId);
  }
  return null;
};

module.exports = {
  getCredits,
  addCredit,
  updateCredit,
  deleteCredit,
  toggleCreditInclusion,
  addPayment,
  deletePayment,
};
