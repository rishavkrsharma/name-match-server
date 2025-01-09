import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { calculateNameSimilarity } from './utils/similaity.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    return res.status(200).json({
        message: 'Hello from server'
    });
});

app.post('/api/compare-names', async (req, res) => {
    const { name1, name2 } = req.body;

    if (!name1 || !name2) {
        return res.status(400).json({ error: "Both 'name1' and 'name2' are required." });
    }

    const similarity = await calculateNameSimilarity(name1, name2);

    return res.status(200).json({
        isSuccess: true,
        message: 'Name similarity calculated successfully.',
        similarity
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
