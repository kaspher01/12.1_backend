const db = require('../db/conn');
const { ObjectId } = require('mongodb');
const router = require('express').Router();

router.get('/products', async (req, res) => {
    const collection = db.getDb().collection('products');

    try {
        let query = {};

        if (req.query.nazwa)
            query.nazwa = { $regex: req.query.nazwa, $options: 'i' };

        if (req.query.cena)
            query.cena = { $lte: parseFloat(req.query.cena) };

        if (req.query.ilosc)
            query.ilosc = { $lte: parseInt(req.query.ilosc) };

        let sort = {};
        if (req.query.sort) {
            const parts = req.query.sort.split(':');
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        }

        const products = await collection.find(query).sort(sort).toArray();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/products', async (req, res) => {
    const collection = db.getDb().collection('products');

    const { nazwa, cena, opis, ilosc, jednostka_miary } = req.body;

    const existingProduct = await collection.findOne({ nazwa });
    if (existingProduct) {
        return res.status(400).json({ error: 'Produkt o podanej nazwie już istnieje.' });
    }

    const newProduct = { nazwa, cena, opis, ilosc, jednostka_miary };

    const result = await collection.insertOne(newProduct);
    res.status(201).json({ message: 'Produkt dodany pomyślnie.', insertedId: result.insertedId });
});

router.put('/products/:id', async (req, res) => {

    const collection = db.getDb().collection('products');

    const productId = req.params.id;
    const { nazwa, cena, opis, ilosc, jednostka_miary } = req.body;

    const existingProduct = await collection.findOne({ _id: new ObjectId(productId) });
    if (!existingProduct) {
        return res.status(404).json({ error: 'Produkt o podanym ID nie istnieje.' });
    }

    const updatedProduct = {
        $set: { nazwa, cena, opis, ilosc, jednostka_miary }
    };

    await collection.updateOne({ _id: new ObjectId(productId) }, updatedProduct);
    res.status(200).json({ message: 'Produkt zaktualizowany pomyślnie.' });

});

router.delete('/products/:id', async (req, res) => {
    const collection = db.getDb().collection('products');

    const productId = req.params.id;

    const existingProduct = await collection.findOne({ _id: new ObjectId(productId) });
    if (!existingProduct) {
        return res.status(404).json({ error: 'Produkt o podanym ID nie istnieje.' });
    }

    await collection.deleteOne({ _id: new ObjectId(productId) });
    res.status(200).json({ message: 'Produkt usunięty pomyślnie.' });
});

router.get('/products-report', async (req, res) => {
    const collection = db.getDb().collection('products');

    const pipeline = [
        {
            $group: {
                _id: null,
                products: {
                    $push: {
                        _id: '$_id',
                        nazwa: '$nazwa',
                        ilosc: '$ilosc',
                        cena: '$cena',
                        jednostka_miary: '$jednostka_miary'
                    }
                },
                totalQuantity: { $sum: '$ilosc' },
                totalValue: { $sum: { $multiply: ['$ilosc', '$cena'] } }
            }
        }
    ];

    const result = await collection.aggregate(pipeline).toArray();

    res.json({ inventoryReport: result[0] });
});

module.exports = router;