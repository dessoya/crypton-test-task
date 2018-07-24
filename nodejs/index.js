'use strict';

var coroutine 	= require('coroutine');
var express 	= require('express');
var bodyParser 	= require('body-parser');
var multipart 	= require('connect-multiparty');
var Wallet  	= require('ethereumjs-wallet');
var EthUtil  	= require('ethereumjs-util');
var Web3  		= require('web3');
var Tx 			= require('ethereumjs-tx');

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

var app = express();
var multipartMiddleware = multipart();

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
 
mongoose.connect('mongodb://localhost:27017/local', { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var Schema = mongoose.Schema;

var TransactionsSchema = new Schema({ id: Schema.ObjectId,	createdAt: Date, tx: String },{ timestamps: true });
var TransactionsModel = mongoose.model('transactions', TransactionsSchema);

app.use(bodyParser());
app.use('/sendTransaction.json', multipartMiddleware);

app.get('/list.json', function(req, res) {

	var g_List = coroutine(function*(g) {
		var query = TransactionsModel.find();

		query.select('createdAt tx');
		query.sort({ created_at: 1 });

		// query.limit(5);

		var txs = yield query.exec(g.resume);
		res.send(JSON.stringify({ status: "ok", txs: txs }));		
	});

	g_List(function(err, result) {
		if(err) {
			res.send(JSON.stringify({ status: "error", error: err }));
			return;
		}
	});

});

app.post('/sendTransaction.json', function(req, res){

	var g_SendTransaction = coroutine(function*(g) {

		// dirty hack :(
		var keystore = Buffer.from(req.body.keystore.substring(13), 'base64').toString("ascii")

		const privateKeyBuffer = EthUtil.toBuffer('0x' + keystore);
		const wallet = Wallet.fromPrivateKey(privateKeyBuffer);
		const address = wallet.getAddressString();

		var number = yield web3.eth.getTransactionCount(address, g.resume);

		var rawTx = {
			nonce: 		number,
			gasPrice: 	20000000000,
			gasLimit: 	90000,
			to: 		'0x0000000000000000000000000000000000000000',
			value: 		req.body.amount,
			data: 		'0x7f'
		}

		var tx = new Tx(rawTx);
		var privateKey = new Buffer(keystore, 'hex');
		tx.sign(privateKey);

		var serializedTx = tx.serialize();

		var txhash = yield web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), g.resume);
		console.log(txhash);

		var o = { tx: txhash.toString('hex') };
		console.log(o);

		var txdoc = new TransactionsModel(o);
		var doc = yield txdoc.save(g.resume);
		// console.log(doc);

		res.send(JSON.stringify({ status: "ok", tx: txhash, createdAt: doc.createdAt }));

	});

	g_SendTransaction(function(err, result) {
		if(err) {
			var message = err.message;

			if(message.indexOf("sender doesn't have enough funds to send tx.") != -1) {
				message = "sender doesn't have enough funds to send tx.";
			}
			else if(message.indexOf("Private key does not satisfy the curve requirements (ie. it is invalid)") != -1) {
				message = "Private key does not satisfy the curve requirements (ie. it is invalid)";
			}			
			else {
				console.log(err);
				message = "unknown error";	
			}
			res.send(JSON.stringify({ status: "error", error: message }));
			return;
		}
	});

});

app.get('/getTransaction.json', function(req, res){

	var g_GetTransaction = coroutine(function*(g) {

		var tx = yield web3.eth.getTransaction(req.query.tx, g.resume)

		if(tx === null) {
			res.send(JSON.stringify({ status: "error", error: "transaction not found" }));
			return;
		}

		console.log(tx);

		res.send(JSON.stringify({ status: "ok", tx: tx }));		
	})

	g_GetTransaction(function(err, result) {
		if(err) {
			var message = err.message;

			if(message.indexOf("sender doesn't have enough funds to send tx.") != -1) {
				message = "sender doesn't have enough funds to send tx.";
			}
			else if(message.indexOf("Private key does not satisfy the curve requirements (ie. it is invalid)") != -1) {
				message = "Private key does not satisfy the curve requirements (ie. it is invalid)";
			}			
			else {
				console.log(err);
				message = "unknown error";	
			}
			res.send(JSON.stringify({ status: "error", error: message }));
			return;
		}
	});

})

app.listen(3001);