// ajax获取colors.json中的数据
let req = new XMLHttpRequest();
req.open('GET', '../data/colors.json',true);
req.onreadystatechange = function (){
    if(req.readyState == 4 && req.status == 200){
        colorList(req.responseText);
    }
    return;
};
req.send();

// RGB转HSV函数：HSV对用户来说是一种比较直观的颜色模型
let rgb2hsv = function (rgb) {
    let r = rgb[0]/255, g = rgb[1]/255, b = rgb[2]/255;
    let max = Math.max(r, g, b);
    let  min = Math.min(r, g, b);
    let h, s, v = max;
    let d = max - min;
    s = max == 0 ? 0 : d / max;
    if(max == min){
        h = 0;
    }else{
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, v];
}

let colorsArray;

// 通过获取的数据生成color的列表，添加至ul#colors
function colorList(data){
    // 解析color数据
    colorsArray = JSON.parse(data);
    // 颜色数组根据HSV颜色模型排序
    colorsArray.sort(function(a, b){
        if (rgb2hsv(a.RGB)[0] === rgb2hsv(b.RGB)[0])
            return rgb2hsv(b.RGB)[1] - rgb2hsv(a.RGB)[1];
        else
            return rgb2hsv(b.RGB)[0] - rgb2hsv(a.RGB)[0];
    });
    // 生成color的li元素内容并添加至ul中
    colorsArray.forEach(function (color, i){
        let liEl = document.createElement('li');
        liEl.style.top = Math.floor(i/7)*300 + 'px';
        liEl.style.left = Math.floor(i%7)*65 + 'px';
        liEl.style.borderTop = '6px solid ' + color.hex;
        let divEl = document.createElement('div');
        let aEl = document.createElement('a');
        aEl.innerHTML = `<span class="name" style="color: ${color.hex}">${color.name}</span>
                         <span class="pinyin">${color.pinyin}</span>
                         <span class="rgb">${color.hex}</span>`;
        aEl.appendChild(drawArcAndLine(color.CMYK, color.RGB));
        divEl.appendChild(aEl);
        liEl.appendChild(divEl);
        document.getElementById("colors").appendChild(liEl);
    });
}

// 使用canvas绘制CMYK圆环和RGB长条
function drawArcAndLine(CMYK, RGB){
    let canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 278;
    let ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#fff';
    // 绘制CMYK圆环
    ctx.lineWidth = 6;
    CMYK.forEach(function (value, i){
        let endAngle = (360*value/100-90)*(Math.PI/180);
        if(value == 0) endAngle = 1.5 * Math.PI;
        if(value == 100) endAngle = 3 * Math.PI;
        ctx.beginPath();
        ctx.arc(14,31.3 * (i+1),9,1.5 * Math.PI, endAngle, false);
        ctx.stroke();
    });
    // 绘制RGB长条
    ctx.lineWidth = 1;
    ctx.moveTo(18,150);
    ctx.lineTo(18,150 + RGB[2]/255*(278-150));
    ctx.moveTo(21,150);
    ctx.lineTo(21,150 + RGB[1]/255*(278-150));
    ctx.moveTo(24,150);
    ctx.lineTo(24,150 + RGB[0]/255*(278-150));
    ctx.stroke();
    return canvas;
}

// 为li > div添加鼠标事件
$('#colors').on('mouseover mouseout click', 'li > div', function (event){
    let aEl = $(this).children();
    let pinyin = aEl.children('.pinyin').html();
    // 查找算法有待优化 TODO
    let color = colorsArray.find(function (color){
        return pinyin === color.pinyin;
    });
    let name = color.name;
    let hex = color.hex;
    if (event.type == 'mouseover'){
        // 鼠标移入
        aEl.children('.name').css('color', '#fff');
        $(this).css('background-color', hex);
    }else if(event.type == 'mouseout'){
        // 鼠标移出
        $(this).css('background-color', 'transparent');
    }else if(event.type == 'click'){
        // 点击事件
        $('#wrapper').css('background-color', hex);      // 替换页面背景
        $('#data > h2 > #name').html(name);                    // 替换标题名
        $('#data > h2 > #pinyin').html(pinyin.toUpperCase());  //替换标题拼音
        maskCMYK(color.CMYK);       // CMYK遮罩效果
        countRollRGB(color.RGB);    // RGB数值滚动效果
        $('#hexValue > span').html(color.hex);
    }
});

// CMYK遮罩效果
function maskCMYK(CMYK){
    let cont = $('#CMYKcolor > dd > .cont');
    let r = $('#CMYKcolor > dd > .r');
    let l = $('#CMYKcolor > dd > .l');
    CMYK.forEach(function (value, i){
        // 不能用array[]取jQuery对象数组！
        // cont[i].html(value);
        cont.eq(i).html(value);
        if (value < 50){
            r.eq(i).children().css("transform", `rotate(${value*3.6}deg)`);
            l.eq(i).children().css("transform", "rotate(180deg)");
        }else {
            r.eq(i).children().css("transform", "rotate(180deg)");
            l.eq(i).children().css("transform", `rotate(${(value)*3.6}deg)`);
        }
    });
}

let startValue = [0, 0, 0];
// RGB数值滚动  (参考资料：https://blog.csdn.net/weixin_44110923/article/details/114693782)
function countRollRGB(RGB){
    RGB.forEach(function (value, i){
        let options = {
            startVal: startValue[i],
            duration: 1.5,
        };
        let demo = new countUp.CountUp('value'+'RGB'[i], value, options);
        startValue[i] = value;
        if (!demo.error) {
            demo.start();
        } else {
            console.error(demo.error);
        }
    });
}
