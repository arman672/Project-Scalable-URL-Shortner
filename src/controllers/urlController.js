const shortId = require('shortid')
const urlModel = require("../models/urlModel")

//==============================================radis setup======================================================
const redis = require("redis");

const { promisify } = require("util");

const redisClient = redis.createClient(
    14050,
    "redis-14050.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("uFEGb9XOQ9tVZx363gOvS75q3Kkfb1CI", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

const SET_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
//==============================================radis setup======================================================

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
        
        //=============================saving in cache
        await SET_ASYNC(`${urlObj.urlCode}`,8000,JSON.stringify(urlObj))

        return res.status(201).send({ status: true, data: urlObj})
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

const getLongUrl = async function (req, res) {
    try {
        let urlCode = req.params.urlCode
        if (!shortId.isValid(urlCode))
        return res.status(400).send({ status: false, message: "urlCode is invalid" })

        //=============================retriving from cache start
        let cahcedURLData = await GET_ASYNC(`${urlCode}`)
        if (cahcedURLData) {
            let urlObj = JSON.parse(cahcedURLData)
            return res.status(302).redirect(urlObj.longUrl);
        }
        console.log("calling from db")
        //=============================retriving from cache end

        const findLongUrl = await urlModel.findOne({ urlCode: urlCode }).select({ longUrl: 1, _id: 0 })

        if (!findLongUrl)
            return res.status(404).send({ status: false, message: "url not found for the given url code" })

        return res.status(302).redirect(findLongUrl.longUrl);
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { shortenUrl, getLongUrl }