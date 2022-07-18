const validator = require('valid-url')
const shortId = require('shortid')
const urlModel = require("../models/urlModel")

const shortenUrl = async function (req, res) {
    try {
        const longUrl = req.body.longUrl

        if (!longUrl)
            return res.status(400).send({ status: false, message: "please enter longUrl" })

        const regUrl = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/

        if (!regUrl.test(longUrl))
            return res.status(400).send({ status: false, message: "please enter valid longUrl" })

        const findUrl = await urlModel.findOne({ longUrl: longUrl }).select({ _id: 0, urlCode: 1, longUrl: 1, shortUrl: 1 })
        if (findUrl)
            return res.status(200).send({ status: true, message: "short url is already generated", data: findUrl })

        let short = shortId.generate(longUrl)
        let shortUrl = `localhost:3000/${short}`
        let urlObj = {
            "urlCode": short,
            "longUrl": longUrl,
            "shortUrl": shortUrl
        }

        let createUrl = await urlModel.create(urlObj)

        return res.status(201).send({ status: true, data: { urlCode: createUrl.urlCode, longUrl: createUrl.longUrl, shortUrl: createUrl.shortUrl } })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

const getLongUrl = async function (req, res) {
    try {
        let urlCode = req.params.urlCode

        if (!urlCode)
            return res.status(400).send({ status: false, message: "urlCode cannot be empty" })

        if (!shortId.isValid(urlCode))
            return res.status(400).send({ status: false, message: "urlCode is invalid" })

        const findLongUrl = await urlModel.findOne({ urlCode: urlCode }).select({ longUrl: 1, _id: 0 })

        if (!findLongUrl)
            return res.status(404).send({ status: false, message: "url not found for the given url code" })

        return res.status(302).send({ status: true, data: findLongUrl })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { shortenUrl, getLongUrl }