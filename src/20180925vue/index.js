var app = new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue113!',
        user:{
            name : '小军'
        }
    }
})

var app2 = new Vue({
    el: '#app-2',
    data: {
        message: '页面加载于 ' + new Date().toLocaleString(),
        selected: 'A',
        options: [
            { text: 'One', value: 'A' },
            { text: 'Two', value: 'B' },
            { text: 'Three', value: 'C' }
        ]
    }
})

var app3 = new Vue({
    el: '#app-3',
    data: {
        seen: true,
        arr: [
            { name: 1 },
            { name: 2 },
            { name: 3 },
            { name: 4 }
        ],
        a :[1,2,3,4]
    }
})