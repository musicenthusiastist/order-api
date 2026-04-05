# Order Management REST API

## Overview
This project is a RESTful API for managing customer orders in an e-commerce style workflow. It was built using Node.js, Express.js, and SQLite.

The API supports:
- Creating a new order
- Retrieving all orders
- Retrieving one order by ID
- Updating order status
- Deleting an order

It also demonstrates non-blocking asynchronous programming by simulating a payment gateway inside the `POST /orders` route using `async/await`.

---

## Technologies Used
- Node.js
- Express.js
- SQLite3

---

## Installation

1. Clone or download the project folder.
2. Open a terminal in the project folder.
3. Run:

```bash
npm install