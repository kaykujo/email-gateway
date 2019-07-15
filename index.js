const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const app = express();

app.use(cors()); // allow cross domain

dotenv.load({
	path: path.join(__dirname, '.env')
});
app.set('superSecret', process.env.TOKEN_SECRET);
app.use(bodyParser.json({
	limit: '50mb'
}));
app.use(bodyParser.urlencoded({
	limit: '50mb',
	extended: true
}));

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// =======================
// routes ================
// =======================
app.get('/', function (req, res) {
	res.status(401).json({
		success: false,
		message: 'Unauthorized access'
	});
});

var apiRoutes = express.Router();

// route middleware to verify a token
apiRoutes.use(function (req, res, next) {
	var token = req.headers['x-access-token'];

	if (token == process.env.TOKEN_ID) {
		next();
	} else {
		res.status(401).json({
			success: false,
			message: 'Access not granted'
		});
	}
});

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// route to send email (POST /api/send)
apiRoutes.post('/send', function (req, res) {
	const prmName = req.body.name;
	const prmContactNo = req.body.contactNo;
	const prmEmail = req.body.email;
	const prmMessage = req.body.message;
	const prmFrom = req.body.from;
	const prmTo = req.body.to;
	const prmWebsite = req.body.website;
	if (!prmName || !prmContactNo || !prmEmail || !prmMessage || !prmFrom || !prmTo || !prmWebsite) {
		res.status(400).json({
			success: false,
			msg: 'Invalid parameters'
		});
	} else {
		const prmBody = `${prmMessage}<br><br>Name: ${prmName}<br>Contact No: ${prmContactNo}<br>Email: ${prmEmail}`;
		const msg = {
			to: prmTo,
			from: prmFrom,
			replyTo: prmEmail,
			subject: `Enquiry from ${prmWebsite}`,
			html: prmBody
		};
		sgMail
			.send(msg)
			.then(() => {
				res.json({
					success: true,
					msg: 'Email sent'
				});
			})
			.catch(error => {
				console.error(error.toString());
				res.status(400).json({
					success: false,
					msg: 'Send error',
					error: error.toString()
				});
			});
	}
});

// ========================
// start the server =======
// ========================
app.listen(process.env.PORT);
console.log('Server started at port ' + process.env.PORT);