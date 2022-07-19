const { application } = require('express')
const express = require('express')
const router = express.Router()
const urlCtrl = require("../controllers/urlController")

router.post("/url/shorten",urlCtrl.shortenUrl)
router.get("/:urlCode",urlCtrl.getLongUrl)

router.all("/*", function(req, res) {
    res.status(404).send({ msg: "No such Api found" })
})

module.exports = router;