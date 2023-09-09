const express= require('express');
const app = express();
const multer = require('multer');
const upload = multer();
const https = require('https');
const fs = require('fs');
const path = require('path');
const zip = require('express-easy-zip');
const mongoose = require('mongoose');
const Address = require('./address');
const Quotes = require('./quotes');
require('dotenv').config()

app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(express.static('images'))
app.use(zip())

/* connect to database */
const connectMongoose = async() => {
    await mongoose.connect(process.env.MONGO_URL, {dbName: process.env.DB_NAME})
        .then(console.log('connected'))
}

connectMongoose()

// SDK initialization

var ImageKit = require("imagekit");

var imagekit = new ImageKit({
    publicKey : process.env.PUBLIC_KEY,
    privateKey : process.env.PRIVATE_KEY,
    urlEndpoint : "https://ik.imagekit.io/76nhtc3tu"
});


app.get('/', (req, res) => {
    res.render('quote')
});

app.post('/address', upload.array('images', 8), async(req, res) => {
    const findOneAddress = await Address.findOne({address: req.body.address});
    const findOneQuote = await Quotes.findOne({name: req.body.name});
    const address = new Address({});
    const quote = new Quotes({});
    if(!findOneAddress) {
        req.files.map(file => {
            imagekit.upload({
                file: file.buffer.toString('base64'),
                fileName: file.originalname
            }, async function(err, result) {
                if(err) {
                    return err
                } else {
                    await Quotes.findOneAndUpdate({
                        name: req.body.name
                    }, {
                        $push: {images: {
                            url: result.url,
                            imageName: result.name
                        }}
                    }, {
                        new: true
                    }).then(data => {
                        data.save()
                    })
                }
            })
        });
        address.address = req.body.address
        quote.name = req.body.name
        quote.description = req.body.description
        address.quotes.push(quote);
        await address.save();
        await quote.save();
    } else if(findOneAddress && !findOneQuote) {
        req.files.map(file => {
            imagekit.upload({
                file: file.buffer.toString('base64'),
                fileName: file.originalname
            }, async function(err, result) {
                if(err) {
                    return err
                } else {
                    await Quotes.findOneAndUpdate({name: req.body.name}, {
                        $push: { images: {
                            url: result.url,
                            imageName: result.name
                        }}}, {new: true}).then(data => {
                        data.save()
                    })
                }
            })
        })
        quote.name = req.body.name
        quote.description = req.body.description
        await quote.save();
        await Address.findOneAndUpdate({
            address: req.body.address
        }, {
            $push: {quotes: quote}
        }, {
            new: true
        }).then(data => {
            data.save();
        })
    } else {
        console.log('could not save quote')
    }
    res.render('address')
});




app.get('/getAllImage', async(req, res) => {
    const allQuotes = await Quotes.find({});
    res.render('display', {quotes: allQuotes})
})

app.post('/getImage',async(req, res) => {
    const quote = await Quotes.findById(req.body._id);
    quote.images.map(image => {
        const url = image.url;
        const imageName = path.join(__dirname, '/images', image.imageName);
        const file = fs.createWriteStream(imageName)

        https.get(url, res => {
            res.pipe(file)
            file.on('finish', () => {
                file.close()
                console.log('download image file')
            })
        })

    })
    res.render('downloadImage')
})

app.get('/download', (req, res) => {
    res.zip({
        files: [
            { comment: 'comment',
                 date: new Date(),
                 type: 'file' },
            { path: path.join(__dirname, '/images/'), name: 'Quote-Images' } 
        ],
        filename: 'QuoteImages.zip'
    });
})

// app.get('/downloaded', (req, res) => {
//     const files = fs.readdirSync(__dirname + '/images')

//     files.forEach(img => {
//         fs.unlink(path.join(__dirname, '/images/', img), () => {
//             console.log('deleted')
//         })
//     })
//     res.end()
// })

app.listen(3000)