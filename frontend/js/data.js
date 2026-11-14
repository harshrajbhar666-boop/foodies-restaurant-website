/* ==========================================================================
   Foodies Restaurant — content catalogue
   Single source of truth for dishes, categories, testimonials and gallery.
   Shared by index.html, menu.html and orders.html.
   ========================================================================== */
(function () {
  'use strict';

  const IMG = 'assets/img/';

  const CATEGORIES = [
    { id: 'all', label: 'All dishes' },
    { id: 'starters', label: 'Starters' },
    { id: 'mains', label: 'Main course' },
    { id: 'biryani', label: 'Biryani & breads' },
    { id: 'desserts', label: 'Desserts' },
    { id: 'drinks', label: 'Drinks' }
  ];

  const DISHES = [
    {
      id: 'paneer-tikka',
      name: 'Malai Paneer Tikka',
      category: 'starters',
      price: 329,
      rating: 4.8,
      veg: true,
      badge: "Chef's pick",
      desc: 'Char-grilled cottage cheese in a hung-curd marinade, smoked with clove and served with mint chutney.',
      img: IMG + 'dish-paneer-tikka.jpg',
      popular: true
    },
    {
      id: 'tandoori-chicken',
      name: 'Tandoori Chicken',
      category: 'starters',
      price: 429,
      rating: 4.9,
      veg: false,
      badge: 'Bestseller',
      desc: 'Overnight yoghurt and spice marinade, roasted in the clay oven, finished with chaat masala and lime.',
      img: IMG + 'dish-tandoori-chicken.jpg',
      popular: true
    },
    {
      id: 'chicken-65',
      name: 'Chicken 65',
      category: 'starters',
      price: 349,
      rating: 4.7,
      veg: false,
      badge: '',
      desc: 'Crisp fried chicken tossed with curry leaves, dried red chilli and roasted garlic.',
      img: IMG + 'dish-chicken-65.jpg',
      popular: false
    },
    {
      id: 'spring-rolls',
      name: 'Garden Veg Spring Rolls',
      category: 'starters',
      price: 249,
      rating: 4.6,
      veg: true,
      badge: '',
      desc: 'Hand-rolled crisp rolls packed with seasonal vegetables, served with a sweet chilli dip.',
      img: IMG + 'dish-spring-rolls.jpg',
      popular: false
    },
    {
      id: 'butter-chicken',
      name: 'Old Delhi Butter Chicken',
      category: 'mains',
      price: 449,
      rating: 4.9,
      veg: false,
      badge: 'Bestseller',
      desc: 'Slow-cooked chicken in a silky tomato-butter gravy, finished with cream and hand-crushed kasuri methi.',
      img: IMG + 'dish-butter-chicken.jpg',
      popular: true
    },
    {
      id: 'paneer-masala',
      name: 'Paneer Butter Masala',
      category: 'mains',
      price: 389,
      rating: 4.8,
      veg: true,
      badge: '',
      desc: 'Cottage cheese simmered in a cashew-tomato masala with a whisper of fenugreek and fresh cream.',
      img: IMG + 'dish-paneer-masala.jpg',
      popular: false
    },
    {
      id: 'dal-makhani',
      name: '12-Hour Dal Makhani',
      category: 'mains',
      price: 329,
      rating: 4.8,
      veg: true,
      badge: 'Slow cooked',
      desc: 'Black lentils simmered overnight over a low flame with white butter, cream and a hint of smoke.',
      img: IMG + 'dish-dal-makhani.jpg',
      popular: true
    },
    {
      id: 'margherita',
      name: 'Wood-fired Margherita',
      category: 'mains',
      price: 399,
      rating: 4.7,
      veg: true,
      badge: '',
      desc: '48-hour fermented dough, San Marzano tomato, fior di latte mozzarella and torn basil.',
      img: IMG + 'dish-pizza.jpg',
      popular: false
    },
    {
      id: 'hyderabadi-biryani',
      name: 'Hyderabadi Chicken Biryani',
      category: 'biryani',
      price: 499,
      rating: 4.9,
      veg: false,
      badge: 'Signature',
      desc: 'Long-grain basmati layered with saffron, fried onion and marinated chicken, sealed and dum-cooked.',
      img: IMG + 'dish-biryani.jpg',
      popular: true
    },
    {
      id: 'masala-dosa',
      name: 'Ghee Masala Dosa',
      category: 'biryani',
      price: 259,
      rating: 4.7,
      veg: true,
      badge: '',
      desc: 'Crisp rice-lace crepe roasted in ghee, filled with spiced potato masala, with two chutneys.',
      img: IMG + 'dish-masala-dosa.jpg',
      popular: false
    },
    {
      id: 'butter-naan',
      name: 'Butter Naan',
      category: 'biryani',
      price: 89,
      rating: 4.6,
      veg: true,
      badge: '',
      desc: 'Soft clay-oven naan brushed generously with white butter and a pinch of nigella.',
      img: IMG + 'dish-butter-naan.jpg',
      popular: false
    },
    {
      id: 'gulab-jamun',
      name: 'Warm Gulab Jamun',
      category: 'desserts',
      price: 179,
      rating: 4.9,
      veg: true,
      badge: 'Guest favourite',
      desc: 'Milk dumplings fried golden and soaked in a cardamom-rose syrup, served warm.',
      img: IMG + 'dish-gulab-jamun.jpg',
      popular: true
    },
    {
      id: 'lava-brownie',
      name: 'Choco Lava Brownie',
      category: 'desserts',
      price: 249,
      rating: 4.8,
      veg: true,
      badge: '',
      desc: 'Molten-centre dark chocolate brownie with vanilla bean ice cream and a salted caramel drizzle.',
      img: IMG + 'dish-brownie.jpg',
      popular: false
    },
    {
      id: 'mango-lassi',
      name: 'Alphonso Mango Lassi',
      category: 'drinks',
      price: 159,
      rating: 4.8,
      veg: true,
      badge: 'Seasonal',
      desc: 'Alphonso mango churned with thick curd, cardamom and a saffron thread on top.',
      img: IMG + 'dish-mango-lassi.jpg',
      popular: false
    },
    {
      id: 'masala-chai',
      name: 'Kadak Masala Chai',
      category: 'drinks',
      price: 89,
      rating: 4.6,
      veg: true,
      badge: '',
      desc: 'Assam leaves simmered with ginger, green cardamom and cloves, served in a kulhad.',
      img: IMG + 'dish-masala-chai.jpg',
      popular: false
    }
  ];

  const TESTIMONIALS = [
    {
      name: 'Ananya Deshpande',
      role: 'Regular since 2019',
      initials: 'AD',
      stars: 5,
      text: 'The butter chicken here tastes like a Sunday lunch at home, only better. The room is warm, the service is quick, and the dal makhani is worth the drive across the city.'
    },
    {
      name: 'Rohit Menon',
      role: 'Ordered 34 times',
      initials: 'RM',
      stars: 5,
      text: 'Delivery arrived in 24 minutes, still steaming. Packaging was spotless and the biryani had proper dum layers. This has quietly become our Friday ritual.'
    },
    {
      name: 'Sneha Kulkarni',
      role: 'Food blogger',
      initials: 'SK',
      stars: 5,
      text: 'Every plate is styled without being fussy. The paneer tikka has real smoke on it, and the mango lassi is thick enough to stand a spoon in.'
    },
    {
      name: 'Imran Shaikh',
      role: 'Family dinner, party of 6',
      initials: 'IS',
      stars: 4,
      text: 'Booked the corner table for my parents’ anniversary. They dimmed the lights, brought out a dessert with a candle, and did not charge us for it. Classy touch.'
    },
    {
      name: 'Priya Raghavan',
      role: 'Regular since 2021',
      initials: 'PR',
      stars: 5,
      text: 'I am fussy about spice levels and they get it right every single time. The menu is short, which I like — everything on it is made properly.'
    },
    {
      name: 'Aditya Verma',
      role: 'Office lunch orders',
      initials: 'AV',
      stars: 5,
      text: 'We order for twelve people every other week. Orders are always correct, always on time, and the team calls ahead if anything is running late.'
    }
  ];

  const GALLERY = [
    { src: IMG + 'gallery-1.jpg', caption: 'The dining room, 7 pm', tall: false, wide: true },
    { src: IMG + 'gallery-2.jpg', caption: 'Festive thali service', tall: true, wide: false },
    { src: IMG + 'gallery-3.jpg', caption: 'Biryani, straight from the dum', tall: false, wide: false },
    { src: IMG + 'gallery-4.jpg', caption: 'Naan, fresh off the tandoor', tall: true, wide: false },
    { src: IMG + 'gallery-5.jpg', caption: 'Dessert, always', tall: false, wide: false },
    { src: IMG + 'gallery-6.jpg', caption: 'Slow-cooked, every day', tall: true, wide: false },
  ];

  window.FOODIES_DATA = { CATEGORIES, DISHES, TESTIMONIALS, GALLERY };
})();
