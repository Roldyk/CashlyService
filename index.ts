import express from "express";
import authRouter from "./Routes/authRouter";
import presupuestoRouter from "./Routes/presupuestosRouter";
import gastosRouter from "./Routes/gastosRouter";

const app = express();
const port = 3000;

app.use(express.json());
app.use("/auth", authRouter);
app.use("/presupuesto", presupuestoRouter);
app.use("/gastos", gastosRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running  at http://localhost:${port}`);
});
