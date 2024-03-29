const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config({ path: './config.env' });
const port = process.env.PORT || 5000;
const apiRoutes = require('./routes/api.js');

app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);

const dbo = require('./db/conn');


app.listen(port, () => {
    dbo.connectToServer((err) => {
        if (err) console.error(err);
    }).then(() => {console.log(`Server is running on port: ${port}`)});
});