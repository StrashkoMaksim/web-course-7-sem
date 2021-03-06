const {validationResult} = require("express-validator");
const config = require("config");
const Uuid = require('uuid')
const Food = require('../models/Food')
const FoodCategory = require('../models/FoodCategory')
const fs = require("fs");
const {Types} = require("mongoose");

class AuthController {
    async getAll (req, res) {
        try {
            const foods = await Food.find()

            res.status(200).json(foods)
        } catch (e) {
            console.log(e)
            res.status(500).json({message: 'Что-то пошло не так, попробуйте снова.'})
        }
    }


    async add (req, res) {
        try {
            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Некорректные данные при создании блюда'
                })
            }

            const {title, description, price, categoryId} = req.body

            const category = await FoodCategory.findOne({ _id: categoryId })

            if (!category) {
                return res.status(400).json({ message: 'Выбранная категория отсутствует' })
            }

            if (!req.files) {
                return res.status(400).json({ message: 'Отсутствует изображение блюда' })
            }

            const img = req.files.img

            if (img.name.slice(-4) != '.png') {
                return res.status(400).json({ message: 'Изображение не в формате .png' })
            }

            const imgName = Uuid.v4() + ".png"

            img.mv(`${config.get('staticPath')}\\${imgName}`)

            const food = new Food({title, description, price, 'img': imgName})

            await food.save()

            category.foods.push(food._id)

            await category.save()

            const foods = await FoodCategory.find().populate('foods')

            res.status(201).json({message: 'Блюдо создано', foods})
        } catch (e) {
            console.log(e)
            res.status(500).json({message: 'Что-то пошло не так, попробуйте снова.'})
        }
    }


    async deleteOne (req, res) {
        try {
            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Некорректный ID'
                })
            }

            const { _id } = req.query

            const food = await Food.findOne({_id})

            if (!food) {
                return res.status(400).json({ message: 'Указанное блюдо отсутствует' })
            }

            // Удаление изображения блюда
            fs.unlinkSync(`${config.get('staticPath')}\\${food.img}`)

            // Удаление блюда из категории
            const category = await FoodCategory.findOne({foods: _id})

            category.foods = category.foods.filter(food => food.toString() !== _id)
            await category.save()

            // Удаление блюда из списка блюд
            food.remove()

            // Результирующий массив блюд
            const foods = await FoodCategory.find().populate('foods')

            res.json({ message: "Блюдо успешно удалено", foods })
        } catch (e) {
            console.log(e)
            res.status(500).json({message: 'Что-то пошло не так, попробуйте снова.'})
        }
    }


    async getFew (req, res) {
        try {
            let promises = []

            for (const _id of JSON.parse(req.query.IDs)) {
                const food = Food.findOne({_id}).exec()

                promises.push(food)
            }

            const done = await Promise.all(promises)

            for (const food of done) {
                if (!food) {
                    return res.status(400).json({ message: 'Одного из блюд не существует' })
                }
            }

            res.status(200).json(done)
        } catch (e) {
            console.log(e)
            res.status(500).json({message: 'Что-то пошло не так, попробуйте снова.'})
        }
    }
}

module.exports = new AuthController()