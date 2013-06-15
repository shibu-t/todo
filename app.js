
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app);

var mongoose = require('mongoose');

//localhostのnode_memo_demoのデータベースに接続。
var db = mongoose.connect('mongodb://localhost/todo');
//メモのスキーマを宣言。
var TodoSchema = new mongoose.Schema({
    type: {type: String},
    text: {type: String},
    date: {type: Date, default: Date.now},
});
//スキーマからモデルを生成。
var Todo = db.model('todo',TodoSchema);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var io = require('socket.io').listen(server);

io.sockets.on('connection',function(socket){
    Todo.find(function(err,items){
        if(err){console.log(err);}
        //接続したユーザにメモのデータを送る。
        socket.emit('create',items);
    });
    //createイベントを受信した時、データベースにTodoを追加する。
    socket.on('create',function(todoData){
        //モデルからインスタンス作成
        var todo = new Todo(todoData);
        //データベースに保存。
        todo.save(function(err){
            if(err){ return; }
            socket.broadcast.json.emit('create',[todo]);
            socket.emit('create',[todo]);
        });
    });
    //moveイベントを受信した時、Todoのpositionをアップデートする。
    socket.on('move',function(data){
        //データベースから_idが一致するデータを検索
        Todo.findOne({_id:data._id},function(err,todo){
            if(err || todo === null){return;}
            todo.position = data.position;
            todo.save();
            //他のクライアントにイベントを伝えるためにbroadcastで送信する。
            socket.broadcast.json.emit('move',data);
        });
    });
    //update-textイベントを受信した時、Todoのtextをアップデートする。
    socket.on('update-text',function(data){
        Todo.findOne({_id:data._id},function(err,todo){
            if(err || todo === null){return;}
            todo.type = data.type;
            todo.text = data.text;
            todo.save();
            socket.broadcast.json.emit('update-text',data);
        });
    });
    //removeイベントを受信した時、データベースから削除する。
    socket.on('remove',function(data){
        Todo.findOne({_id:data._id},function(err,todo){
            if(err || todo === null){return;}
            todo.remove();
            socket.broadcast.json.emit('remove',data);
        });
    });
});
