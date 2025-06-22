import express from 'express';
import authRouter from './Routes/authRouter';
import presupuestoRouter from './Routes/presupuestosRouter';

const app = express();
const port = 3000;
import { PrismaClient } from './generated/prisma';
const prisma = new PrismaClient();

app.use(express.json());
app.use('/auth', authRouter);
app.use('/presupuesto', presupuestoRouter);

app.get('/', (req, res) => {
    res.send('Hello World!');
    }); 

    app.listen(port, () => { 
    console.log(`Server is running  at http://localhost:${port}`);
});
