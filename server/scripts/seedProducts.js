require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  { id: 1,  name: "Toor Dal (Pigeon Peas) 4 lbs",       brand: "24 Mantra Organic", category: "Dal & Lentils",      price: 8.99,  originalPrice: 11.99, rating: 4.5, reviews: 234,  stock: "In Stock", emoji: "🫘", badge: null },
  { id: 2,  name: "Chana Dal 2 lbs",                     brand: "Swagat",            category: "Dal & Lentils",      price: 3.99,  originalPrice: null,  rating: 4.3, reviews: 180,  stock: "In Stock", emoji: "🫘", badge: null },
  { id: 3,  name: "Moong Dal Split 2 lbs",               brand: "Swagat",            category: "Dal & Lentils",      price: 4.99,  originalPrice: null,  rating: 4.4, reviews: 210,  stock: "In Stock", emoji: "🫘", badge: null },
  { id: 4,  name: "Masoor Dal 2 lbs",                    brand: "Roshni",            category: "Dal & Lentils",      price: 3.99,  originalPrice: null,  rating: 4.2, reviews: 165,  stock: "In Stock", emoji: "🫘", badge: null },
  { id: 5,  name: "Urad Dal 2 lbs",                      brand: "Swagat",            category: "Dal & Lentils",      price: 4.99,  originalPrice: null,  rating: 4.3, reviews: 190,  stock: "In Stock", emoji: "🫘", badge: null },
  { id: 6,  name: "Toor Dal Oily 4 lbs",                 brand: "Swagat",            category: "Dal & Lentils",      price: 8.99,  originalPrice: null,  rating: 4.4, reviews: 145,  stock: "In Stock", emoji: "🫘", badge: null },
  { id: 7,  name: "Kala Chana 4 lbs",                    brand: "Swagat",            category: "Dal & Lentils",      price: 5.99,  originalPrice: null,  rating: 4.2, reviews: 120,  stock: "In Stock", emoji: "🫘", badge: null },
  { id: 8,  name: "Kabuli Chana 2 lbs",                  brand: "Swagat",            category: "Dal & Lentils",      price: 4.99,  originalPrice: null,  rating: 4.3, reviews: 130,  stock: "In Stock", emoji: "🫘", badge: null },
  { id: 9,  name: "Basmati Rice Premium 10 lbs",         brand: "Lal Qilla",         category: "Rice & Grains",      price: 18.99, originalPrice: 22.99, rating: 4.8, reviews: 512,  stock: "In Stock", emoji: "🌾", badge: null },
  { id: 10, name: "Sona Masoori Rice 20 lbs",            brand: "24 Mantra Organic", category: "Rice & Grains",      price: 29.99, originalPrice: null,  rating: 4.6, reviews: 320,  stock: "In Stock", emoji: "🌾", badge: "Organic" },
  { id: 11, name: "Tilda Basmati 10 lbs",                brand: "Tilda",             category: "Rice & Grains",      price: 14.79, originalPrice: null,  rating: 4.7, reviews: 444,  stock: "In Stock", emoji: "🌾", badge: null },
  { id: 12, name: "Royal Chef Secret Basmati 10 lbs",    brand: "Royal",             category: "Rice & Grains",      price: 21.99, originalPrice: null,  rating: 4.5, reviews: 280,  stock: "In Stock", emoji: "🌾", badge: null },
  { id: 13, name: "Brown Basmati Rice 10 lbs",           brand: "Zebra",             category: "Rice & Grains",      price: 18.99, originalPrice: null,  rating: 4.4, reviews: 195,  stock: "In Stock", emoji: "🌾", badge: null },
  { id: 14, name: "Jasmine Rice 20 lbs",                 brand: "Store Brand",       category: "Rice & Grains",      price: 26.99, originalPrice: null,  rating: 4.3, reviews: 150,  stock: "In Stock", emoji: "🌾", badge: null },
  { id: 15, name: "Parboiled Sella Rice 10 lbs",         brand: "Royal",             category: "Rice & Grains",      price: 17.99, originalPrice: null,  rating: 4.4, reviews: 175,  stock: "In Stock", emoji: "🌾", badge: null },
  { id: 16, name: "MDH Chana Masala 100g",               brand: "MDH",               category: "Spices & Masala",    price: 3.49,  originalPrice: 4.99,  rating: 4.7, reviews: 891,  stock: "Low",      emoji: "🌶️", badge: "Low" },
  { id: 17, name: "Shan Bombay Biryani Masala",          brand: "Shan",              category: "Spices & Masala",    price: 2.59,  originalPrice: null,  rating: 4.8, reviews: 730,  stock: "In Stock", emoji: "🌶️", badge: null },
  { id: 18, name: "MDH Garam Masala 100g",               brand: "MDH",               category: "Spices & Masala",    price: 2.49,  originalPrice: null,  rating: 4.6, reviews: 560,  stock: "In Stock", emoji: "🌶️", badge: null },
  { id: 19, name: "Shan Korma Masala",                   brand: "Shan",              category: "Spices & Masala",    price: 2.59,  originalPrice: null,  rating: 4.7, reviews: 610,  stock: "In Stock", emoji: "🌶️", badge: null },
  { id: 20, name: "Rajah Tandoori Masala 100g",          brand: "Rajah",             category: "Spices & Masala",    price: 3.99,  originalPrice: null,  rating: 4.5, reviews: 320,  stock: "In Stock", emoji: "🌶️", badge: null },
  { id: 21, name: "Cumin Seeds 14 oz",                   brand: "Swagat",            category: "Spices & Masala",    price: 7.99,  originalPrice: null,  rating: 4.6, reviews: 280,  stock: "In Stock", emoji: "🌿", badge: null },
  { id: 22, name: "Turmeric Powder 400g",                brand: "Swagat",            category: "Spices & Masala",    price: 5.99,  originalPrice: null,  rating: 4.5, reviews: 310,  stock: "In Stock", emoji: "🟡", badge: null },
  { id: 23, name: "Coriander Powder 400g",               brand: "Aksar",             category: "Spices & Masala",    price: 5.99,  originalPrice: null,  rating: 4.4, reviews: 240,  stock: "In Stock", emoji: "🌿", badge: null },
  { id: 24, name: "Kashmiri Chilli Whole 14 oz",         brand: "Swagat",            category: "Spices & Masala",    price: 6.99,  originalPrice: null,  rating: 4.5, reviews: 190,  stock: "In Stock", emoji: "🌶️", badge: null },
  { id: 25, name: "MTR Chana Masala 100g",               brand: "MTR",               category: "Spices & Masala",    price: 2.59,  originalPrice: null,  rating: 4.6, reviews: 420,  stock: "In Stock", emoji: "🌶️", badge: null },
  { id: 26, name: "Aashirwad Whole Wheat Atta 10 lbs",   brand: "Aashirvaad",        category: "Atta & Flour",       price: 14.99, originalPrice: 17.99, rating: 4.9, reviews: 347,  stock: "In Stock", emoji: "🌾", badge: null },
  { id: 27, name: "Sujatha Chakki Atta 20 lbs",          brand: "Sujatha",           category: "Atta & Flour",       price: 27.99, originalPrice: null,  rating: 4.7, reviews: 260,  stock: "In Stock", emoji: "🌾", badge: null },
  { id: 28, name: "Besan 2 lbs",                         brand: "Swagat",            category: "Atta & Flour",       price: 4.99,  originalPrice: null,  rating: 4.5, reviews: 198,  stock: "In Stock", emoji: "🌾", badge: null },
  { id: 29, name: "Ragi Flour 2 lbs",                    brand: "Deep",              category: "Atta & Flour",       price: 3.99,  originalPrice: null,  rating: 4.4, reviews: 155,  stock: "In Stock", emoji: "🌾", badge: null },
  { id: 30, name: "Maida All Purpose Flour 4 lbs",       brand: "Five Roses",        category: "Atta & Flour",       price: 6.99,  originalPrice: null,  rating: 4.3, reviews: 120,  stock: "In Stock", emoji: "🌾", badge: null },
  { id: 31, name: "Pure Cow Ghee 32 oz",                 brand: "Amul",              category: "Oils & Ghee",        price: 12.99, originalPrice: 15.99, rating: 4.9, reviews: 678,  stock: "In Stock", emoji: "🧈", badge: null },
  { id: 32, name: "Amul Pure Ghee 454g",                 brand: "Amul",              category: "Oils & Ghee",        price: 9.99,  originalPrice: null,  rating: 4.8, reviews: 520,  stock: "In Stock", emoji: "🧈", badge: null },
  { id: 33, name: "Gopi Cow Ghee 32 oz",                 brand: "Gopi",              category: "Oils & Ghee",        price: 19.99, originalPrice: null,  rating: 4.7, reviews: 345,  stock: "In Stock", emoji: "🧈", badge: null },
  { id: 34, name: "Brio Extra Virgin Olive Oil 1 ltr",   brand: "Brio",              category: "Oils & Ghee",        price: 12.99, originalPrice: null,  rating: 4.6, reviews: 230,  stock: "In Stock", emoji: "🫒", badge: null },
  { id: 35, name: "Avani Mustard Oil 1 ltr",             brand: "Avani",             category: "Oils & Ghee",        price: 6.99,  originalPrice: null,  rating: 4.4, reviews: 185,  stock: "In Stock", emoji: "🫙", badge: null },
  { id: 36, name: "Parachute Coconut Oil 31 fl oz",      brand: "Parachute",         category: "Oils & Ghee",        price: 9.99,  originalPrice: null,  rating: 4.5, reviews: 290,  stock: "In Stock", emoji: "🥥", badge: null },
  { id: 37, name: "Haldiram's Bhujia 14 oz",             brand: "Haldiram's",        category: "Snacks & Namkeen",   price: 6.99,  originalPrice: 8.49,  rating: 4.8, reviews: 1203, stock: "In Stock", emoji: "🍿", badge: null },
  { id: 38, name: "Bikaji Bikaneri Bhujia 400g",         brand: "Bikaji",            category: "Snacks & Namkeen",   price: 3.99,  originalPrice: null,  rating: 4.6, reviews: 680,  stock: "In Stock", emoji: "🍿", badge: null },
  { id: 39, name: "Lays Magic Masala",                   brand: "Lays",              category: "Snacks & Namkeen",   price: 1.49,  originalPrice: null,  rating: 4.5, reviews: 540,  stock: "In Stock", emoji: "🥔", badge: null },
  { id: 40, name: "Kurkure Chilli Chatka",               brand: "Kurkure",           category: "Snacks & Namkeen",   price: 1.39,  originalPrice: null,  rating: 4.4, reviews: 460,  stock: "In Stock", emoji: "🌽", badge: null },
  { id: 41, name: "BC Bikaneri Bhujia 400g",             brand: "Bikano",            category: "Snacks & Namkeen",   price: 3.99,  originalPrice: null,  rating: 4.5, reviews: 380,  stock: "In Stock", emoji: "🍿", badge: null },
  { id: 42, name: "Bombay Kitchen Punjabi Mix 21 oz",    brand: "Bombay Kitchen",    category: "Snacks & Namkeen",   price: 4.99,  originalPrice: null,  rating: 4.6, reviews: 290,  stock: "In Stock", emoji: "🍿", badge: null },
  { id: 43, name: "Parle G Gold Biscuits 1 kg",          brand: "Parle",             category: "Snacks & Namkeen",   price: 6.99,  originalPrice: null,  rating: 4.7, reviews: 820,  stock: "In Stock", emoji: "🍪", badge: null },
  { id: 44, name: "Britannia Marie Gold",                brand: "Britannia",         category: "Snacks & Namkeen",   price: 1.49,  originalPrice: null,  rating: 4.5, reviews: 510,  stock: "In Stock", emoji: "🍪", badge: null },
  { id: 45, name: "Mango Pickle (Achaar) 17.6 oz",       brand: "Mother's Recipe",   category: "Pickles & Chutneys", price: 5.49,  originalPrice: 6.99,  rating: 4.6, reviews: 456,  stock: "Low",      emoji: "🥭", badge: "Low" },
  { id: 46, name: "Hot Mango Chutney 12 oz",             brand: "Patak's",           category: "Pickles & Chutneys", price: 5.99,  originalPrice: null,  rating: 4.5, reviews: 320,  stock: "In Stock", emoji: "🥭", badge: null },
  { id: 47, name: "Lime Pickle Medium 10 oz",            brand: "Patak's",           category: "Pickles & Chutneys", price: 5.99,  originalPrice: null,  rating: 4.4, reviews: 275,  stock: "In Stock", emoji: "🍋", badge: null },
  { id: 48, name: "Priya Mango Tokku Pickle",            brand: "Priya",             category: "Pickles & Chutneys", price: 2.99,  originalPrice: null,  rating: 4.6, reviews: 380,  stock: "In Stock", emoji: "🥭", badge: null },
  { id: 49, name: "Shan Butter Chicken Sauce 350g",      brand: "Shan",              category: "Pickles & Chutneys", price: 3.99,  originalPrice: null,  rating: 4.5, reviews: 290,  stock: "In Stock", emoji: "🍶", badge: null },
  { id: 50, name: "Ashoka Tamarind Concentrate 475g",    brand: "Ashoka",            category: "Pickles & Chutneys", price: 5.99,  originalPrice: null,  rating: 4.5, reviews: 240,  stock: "In Stock", emoji: "🟤", badge: null },
  { id: 51, name: "Deep Methi Paratha 375g",             brand: "Deep",              category: "Frozen Foods",       price: 4.99,  originalPrice: null,  rating: 4.6, reviews: 390,  stock: "In Stock", emoji: "🫓", badge: null },
  { id: 52, name: "Deep Aloo Paratha 383g",              brand: "Deep",              category: "Frozen Foods",       price: 4.99,  originalPrice: null,  rating: 4.7, reviews: 440,  stock: "In Stock", emoji: "🫓", badge: null },
  { id: 53, name: "Ashoka Tandoori Naan 12 ct",          brand: "Ashoka",            category: "Frozen Foods",       price: 9.99,  originalPrice: null,  rating: 4.7, reviews: 520,  stock: "In Stock", emoji: "🫓", badge: null },
  { id: 54, name: "Mezban Punjabi Samosa 1660g",         brand: "Mezban",            category: "Frozen Foods",       price: 13.49, originalPrice: null,  rating: 4.6, reviews: 360,  stock: "In Stock", emoji: "🥟", badge: null },
  { id: 55, name: "Haldiram Punjabi Samosa 20 pc",       brand: "Haldiram's",        category: "Frozen Foods",       price: 14.99, originalPrice: null,  rating: 4.8, reviews: 580,  stock: "In Stock", emoji: "🥟", badge: null },
  { id: 56, name: "Alsafa Chicken Tandoori Samosa 10",   brand: "Al-Safa",           category: "Frozen Foods",       price: 9.99,  originalPrice: null,  rating: 4.5, reviews: 310,  stock: "In Stock", emoji: "🥟", badge: null },
  { id: 57, name: "MK Dal Makhani 283g",                 brand: "Haldiram's",        category: "Frozen Foods",       price: 3.99,  originalPrice: null,  rating: 4.7, reviews: 620,  stock: "In Stock", emoji: "🫕", badge: null },
  { id: 58, name: "Gits Palak Paneer 285g",              brand: "Gits",              category: "Frozen Foods",       price: 2.99,  originalPrice: null,  rating: 4.6, reviews: 480,  stock: "In Stock", emoji: "🫕", badge: null },
  { id: 59, name: "Paneer (Indian Cottage Cheese) 14 oz",brand: "Nanak",             category: "Dairy & Paneer",     price: 7.99,  originalPrice: null,  rating: 4.7, reviews: 178,  stock: "In Stock", emoji: "🧀", badge: null },
  { id: 60, name: "Gopi Paneer 8 oz",                    brand: "Gopi",              category: "Dairy & Paneer",     price: 5.99,  originalPrice: null,  rating: 4.6, reviews: 390,  stock: "In Stock", emoji: "🧀", badge: null },
  { id: 61, name: "Gopi Plain Yogurt 4 lbs",             brand: "Gopi",              category: "Dairy & Paneer",     price: 8.99,  originalPrice: null,  rating: 4.5, reviews: 285,  stock: "In Stock", emoji: "🥛", badge: null },
  { id: 62, name: "Amul Butter 500g",                    brand: "Amul",              category: "Dairy & Paneer",     price: 9.99,  originalPrice: null,  rating: 4.8, reviews: 460,  stock: "In Stock", emoji: "🧈", badge: null },
  { id: 63, name: "Karoun Yogurt Drink Plain",           brand: "Karoun",            category: "Dairy & Paneer",     price: 2.99,  originalPrice: null,  rating: 4.4, reviews: 210,  stock: "In Stock", emoji: "🥛", badge: null },
  { id: 64, name: "Darjeeling First Flush Tea 8.8 oz",   brand: "Goodricke",         category: "Tea, Coffee & Drinks", price: 9.99,  originalPrice: 12.99, rating: 4.7, reviews: 289, stock: "In Stock", emoji: "☕", badge: null },
  { id: 65, name: "Ahmad English Tea No. 1 100 bags",    brand: "Ahmad",             category: "Tea, Coffee & Drinks", price: 5.99,  originalPrice: null,  rating: 4.8, reviews: 640, stock: "In Stock", emoji: "☕", badge: null },
  { id: 66, name: "Tetley Masala Tea 72",                brand: "Tetley",            category: "Tea, Coffee & Drinks", price: 4.99,  originalPrice: null,  rating: 4.6, reviews: 380, stock: "In Stock", emoji: "☕", badge: null },
  { id: 67, name: "Tapal Danedar Tea 450g",              brand: "Tapal",             category: "Tea, Coffee & Drinks", price: 6.96,  originalPrice: null,  rating: 4.7, reviews: 520, stock: "In Stock", emoji: "☕", badge: null },
  { id: 68, name: "Lipton Tea 450g",                     brand: "Lipton",            category: "Tea, Coffee & Drinks", price: 7.99,  originalPrice: null,  rating: 4.5, reviews: 430, stock: "In Stock", emoji: "☕", badge: null },
  { id: 69, name: "Nescafe Gold Blend",                  brand: "Nescafe",           category: "Tea, Coffee & Drinks", price: 14.99, originalPrice: null,  rating: 4.6, reviews: 310, stock: "In Stock", emoji: "☕", badge: null },
  { id: 70, name: "Barbican Malt Drink 6 pack",          brand: "Barbican",          category: "Tea, Coffee & Drinks", price: 11.99, originalPrice: null,  rating: 4.5, reviews: 245, stock: "In Stock", emoji: "🧃", badge: null },
  { id: 71, name: "Mira Mango Nectar 1 ltr",             brand: "Mira",              category: "Tea, Coffee & Drinks", price: 4.99,  originalPrice: null,  rating: 4.4, reviews: 190, stock: "In Stock", emoji: "🧃", badge: null },
  { id: 72, name: "Rasgulla Sweet 1 kg",                 brand: "K.C. Das",          category: "Sweets & Mithai",    price: 8.49,  originalPrice: 10.99, rating: 4.8, reviews: 334,  stock: "In Stock", emoji: "🍮", badge: null },
  { id: 73, name: "Rajbhog Sweets",                      brand: "Rajbhog",           category: "Sweets & Mithai",    price: 7.99,  originalPrice: null,  rating: 4.7, reviews: 420,  stock: "In Stock", emoji: "🍮", badge: null },
  { id: 74, name: "Shahi Kulfi",                         brand: "Shahi",             category: "Sweets & Mithai",    price: 2.19,  originalPrice: null,  rating: 4.6, reviews: 580,  stock: "In Stock", emoji: "🍦", badge: null },
  { id: 75, name: "Nanak Kesar Rasmalai 850g",           brand: "Nanak",             category: "Sweets & Mithai",    price: 12.99, originalPrice: null,  rating: 4.7, reviews: 310,  stock: "In Stock", emoji: "🍮", badge: null },
  { id: 76, name: "Gulab Jamun Box",                     brand: "MTR",               category: "Sweets & Mithai",    price: 7.99,  originalPrice: null,  rating: 4.6, reviews: 390,  stock: "In Stock", emoji: "🍮", badge: null },
  { id: 77, name: "Medjool Dates 2 lbs",                 brand: "Store Brand",       category: "Sweets & Mithai",    price: 14.99, originalPrice: null,  rating: 4.8, reviews: 490,  stock: "In Stock", emoji: "🫘", badge: null },
  { id: 78, name: "Okra Indian 1 lb",                    brand: "Fresh",             category: "Fresh Produce",      price: 4.99,  originalPrice: null,  rating: 4.4, reviews: 180,  stock: "In Stock", emoji: "🥦", badge: "Fresh" },
  { id: 79, name: "Ginger 1 lb",                         brand: "Fresh",             category: "Fresh Produce",      price: 4.99,  originalPrice: null,  rating: 4.5, reviews: 210,  stock: "In Stock", emoji: "🫚", badge: "Fresh" },
  { id: 80, name: "Indian Bitter Melon",                 brand: "Fresh",             category: "Fresh Produce",      price: 2.99,  originalPrice: null,  rating: 4.2, reviews: 140,  stock: "In Stock", emoji: "🥒", badge: "Fresh" },
  { id: 81, name: "Green Mango Any",                     brand: "Fresh",             category: "Fresh Produce",      price: 4.99,  originalPrice: null,  rating: 4.5, reviews: 165,  stock: "In Stock", emoji: "🥭", badge: "Fresh" },
  { id: 82, name: "Indian Eggplant",                     brand: "Fresh",             category: "Fresh Produce",      price: 1.99,  originalPrice: null,  rating: 4.3, reviews: 155,  stock: "In Stock", emoji: "🍆", badge: "Fresh" },
  { id: 83, name: "Curry Leaves",                        brand: "Fresh",             category: "Fresh Produce",      price: 2.49,  originalPrice: null,  rating: 4.6, reviews: 290,  stock: "In Stock", emoji: "🌿", badge: "Fresh" },
  { id: 84, name: "Methi Double Bunch",                  brand: "Fresh",             category: "Fresh Produce",      price: 4.99,  originalPrice: null,  rating: 4.4, reviews: 175,  stock: "In Stock", emoji: "🌿", badge: "Fresh" },
  { id: 85, name: "Spinach",                             brand: "Fresh",             category: "Fresh Produce",      price: 3.99,  originalPrice: null,  rating: 4.5, reviews: 230,  stock: "In Stock", emoji: "🥬", badge: "Fresh" },
  { id: 86, name: "Whole Chicken",                       brand: "Halal",             category: "Meat & Seafood",     price: 4.27,  originalPrice: null,  rating: 4.6, reviews: 310,  stock: "In Stock", emoji: "🍗", badge: "Halal" },
  { id: 87, name: "Chicken Breast Boneless",             brand: "Halal",             category: "Meat & Seafood",     price: 7.23,  originalPrice: null,  rating: 4.5, reviews: 280,  stock: "In Stock", emoji: "🍗", badge: "Halal" },
  { id: 88, name: "Goat Bone Less",                      brand: "Halal",             category: "Meat & Seafood",     price: 16.78, originalPrice: null,  rating: 4.7, reviews: 240,  stock: "In Stock", emoji: "🥩", badge: "Halal" },
  { id: 89, name: "Lamb Chops",                          brand: "Halal",             category: "Meat & Seafood",     price: 16.78, originalPrice: null,  rating: 4.8, reviews: 195,  stock: "In Stock", emoji: "🥩", badge: "Halal" },
  { id: 90, name: "Beef Ground",                         brand: "Halal",             category: "Meat & Seafood",     price: 8.99,  originalPrice: null,  rating: 4.5, reviews: 330,  stock: "In Stock", emoji: "🥩", badge: "Halal" },
  { id: 91, name: "Decorated Clay Diya with Wax",        brand: "Store Brand",       category: "Pooja Items",        price: 4.99,  originalPrice: null,  rating: 4.7, reviews: 320,  stock: "In Stock", emoji: "🪔", badge: null },
  { id: 92, name: "Nandita Incense Box",                 brand: "Nandita",           category: "Pooja Items",        price: 11.99, originalPrice: null,  rating: 4.8, reviews: 410,  stock: "In Stock", emoji: "🪔", badge: null },
  { id: 93, name: "Smokeless Camphor",                   brand: "Bhakti",            category: "Pooja Items",        price: 5.99,  originalPrice: null,  rating: 4.6, reviews: 280,  stock: "In Stock", emoji: "🕯️", badge: null },
  { id: 94, name: "LED Diya",                            brand: "Store Brand",       category: "Pooja Items",        price: 2.99,  originalPrice: null,  rating: 4.5, reviews: 235,  stock: "In Stock", emoji: "🪔", badge: null },
  { id: 95, name: "Holi Gulal Colors 200g",              brand: "Swagat",            category: "Pooja Items",        price: 2.99,  originalPrice: null,  rating: 4.5, reviews: 190,  stock: "In Stock", emoji: "🎨", badge: null },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    await Product.deleteMany({});
    console.log('Cleared existing products');

    const inserted = await Product.insertMany(products);
    console.log(`Successfully seeded ${inserted.length} products`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

seed();
