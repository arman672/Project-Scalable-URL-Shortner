const express = require('express')
const router = express.Router()
const urlCtrl = require("../controllers/urlController")

router.post("/url/shorten",urlCtrl.shortenUrl)
router.get("/:urlCode",urlCtrl.getLongUrl)


module.exports = router;