'use strict';

var url = require('url');

var rp = require('request-promise');
var cheerio = require('cheerio');
var moment = require('moment');

var nodemailer = require('nodemailer');

var smtpConfig = {
  host: 'smtp.163.com',
  secure: true, // use SSL
  // auth: {
    // user: '',
    // pass: ''
  // }
};

// create reusable transporter object using the default SMTP transport
// var transporter = nodemailer.createTransport(smtpConfig);
var transporter = nodemailer.createTransport('direct:?name=baidu.com');

var mailOptions = {
  from: '"Billy" <yym_091025@163.com>', // sender address
  to: 'mzdiy@me.com', // list of receivers
  // subject: 'Hello ✔', // Subject line
  // text: 'Hello world 🐴', // plaintext body
  // html: '<b>Hello world 🐴</b>' // html body
};

var page = 'http://tjee.tongji.edu.cn/index.portal?.pa=aT1QODA1NDkyJnQ9ciZzPW1heGltaXplZCZtPXZpZXc%3D&level=1';
var today = moment(new Date()).format('YYYY-MM-DD');
console.log('check date:', today);
today = '2016-09-20';
var prefix = 'tjee-news';

var options = {
  uri: page,
  transform: function(body) {
    return cheerio.load(body);
  }
};

function parse($, tr) {
  var newtime, title, uri;
  newtime = $(tr).find('span.newtime');
  newtime = newtime ? $(newtime.get(0)).text() : '';
  // 只有当天的新闻才发送邮件
  if(newtime === today) {
    title = prefix + ': ' + '(' + today + ') ' + $(tr).find('a').attr('title');
    uri = $(tr).find('a span').attr('onclick');
    uri = uri.split('"')[1];
    uri = url.resolve(page, uri);
    console.log('got news: ', title);
    console.log('url: ', uri);
    mailOptions.subject = title;
    rp({
      uri: uri,
      transform: function(body) {
        return cheerio.load(body);
      }
    })
    .then(function(content) {
      var html = content('table[width="80%"]').html();
      var index;
      if (!html){
        console.log('no content');
        return;
      }
      mailOptions.html = '<a href="' + uri + '" >原始链接</a><br/><br/>' + html;
      mailOptions.html += '<br/><br/><br/><br/><a href="' + uri + '" >原始链接</a>';
      transporter.sendMail(mailOptions, function(err, info) {
        if(err) return console.log(err);
        console.log('Message Sent:', info.response);
      });
    });
  }
}

rp(options)
.then(function($) {
  $('tr.portlet-section-body, tr.portlet-section-alternate')
  .each(function() {
    parse($, this);
  });
});
