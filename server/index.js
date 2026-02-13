const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data
let quotationRequestList = [
  {
    id: 1,
    customerName: "John Doe",
    title: "Request for Product A",
    dueDate: "2024-07-15",
    type: "Standard",
    status: "Pending",
  },
];

// Generate safe incremental ID
let nextId =
  quotationRequestList.length > 0
    ? Math.max(...quotationRequestList.map(q => q.id)) + 1
    : 1;

// Validate ID param
function validateIdParam(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid ID parameter" });
  }

  req.id = id;
  next();
}

// Validate body
function validateQuotationBody(req, res, next) {
  const { customerName, title, dueDate, type, status } = req.body;

  if (!customerName || typeof customerName !== "string") {
    return res.status(400).json({ message: "customerName is required" });
  }

  if (!title || typeof title !== "string") {
    return res.status(400).json({ message: "title is required" });
  }

  if (!dueDate || isNaN(Date.parse(dueDate))) {
    return res.status(400).json({ message: "Valid dueDate is required" });
  }

  const allowedTypes = ["Standard", "Custom"];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ message: "Invalid type" });
  }

  const allowedStatus = ["Pending", "In Progress", "Completed"];
  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  next();
}

// GET ALL
app.get("/quotations", (req, res) => {
  res.json(quotationRequestList);
});

// GET BY ID
app.get("/quotations/:id", validateIdParam, (req, res) => {
  const quotation = quotationRequestList.find(q => q.id === req.id);

  if (!quotation) {
    return res.status(404).json({ message: "Quotation not found" });
  }

  res.json(quotation);
});

// CREATE
app.post("/quotations", validateQuotationBody, (req, res) => {
  const newQuotation = {
    id: nextId++,
    customerName: req.body.customerName,
    title: req.body.title,
    dueDate: req.body.dueDate,
    type: req.body.type,
    status: req.body.status,
  };

  quotationRequestList.push(newQuotation);
  res.status(201).json(newQuotation);
});

// UPDATE
app.put(
  "/quotations/:id",
  validateIdParam,
  validateQuotationBody,
  (req, res) => {
    const index = quotationRequestList.findIndex(q => q.id === req.id);

    if (index === -1) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    // prevent overwriting id
    const updatedQuotation = {
      ...quotationRequestList[index],
      customerName: req.body.customerName,
      title: req.body.title,
      dueDate: req.body.dueDate,
      type: req.body.type,
      status: req.body.status,
    };

    quotationRequestList[index] = updatedQuotation;

    res.json(updatedQuotation);
  }
);

// DELETE
app.delete("/quotations/:id", validateIdParam, (req, res) => {
  const index = quotationRequestList.findIndex(q => q.id === req.id);

  if (index === -1) {
    return res.status(404).json({ message: "Quotation not found" });
  }

  quotationRequestList.splice(index, 1);

  res.json({ message: "Quotation deleted successfully" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
