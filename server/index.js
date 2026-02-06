const express = require("express");
const cors = require("cors");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

let quotationRequestList = [
  {
    id: 1,
    customerName: "John Doe",
    title: "Request for Product A",
    dueDate: "2024-07-15",
    type: "Standard",
    status: "Pending",
  },
  {
    id: 2,
    customerName: "Jane Smith",
    title: "Inquiry about Service B",
    dueDate: "2024-07-20",
    type: "Custom",
    status: "In Progress",
  },
  {
    id: 3,
    customerName: "Alice Johnson",
    title: "Quotation for Project C",
    dueDate: "2024-07-25",
    type: "Standard",
    status: "Completed",
  },
  {
    id: 4,
    customerName: "Bob Brown",
    title: "Request for Maintenance",
    dueDate: "2024-08-01",
    type: "Standard",
    status: "Pending",
  },
  {
    id: 5,
    customerName: "Charlie White",
    title: "Custom Software Quotation",
    dueDate: "2024-08-05",
    type: "Custom",
    status: "Pending",
  },
];


//GET
app.get("/quotations", (req, res) => {
  res.json(quotationRequestList);
});


//CREATE
app.post("/quotations", (req, res) => {
  const newQuotation = {
    id:
      quotationRequestList.length > 0
        ? quotationRequestList[quotationRequestList.length - 1].id + 1
        : 1,
    customerName: req.body.customerName,
    title: req.body.title,
    dueDate: req.body.dueDate,
    type: req.body.type,
    status: req.body.status,
  };

  quotationRequestList.push(newQuotation);
  res.status(201).json(newQuotation);
});

//UPDATE
app.put("/quotations/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = quotationRequestList.findIndex(q => q.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Quotation not found" });
  }

  quotationRequestList[index] = {
    ...quotationRequestList[index],
    ...req.body,
  };

  res.json(quotationRequestList[index]);
});

//DELETE
app.delete("/quotations/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = quotationRequestList.findIndex(q => q.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Quotation not found" });
  }

  quotationRequestList.splice(index, 1);
  res.json({ message: "Quotation deleted successfully" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
