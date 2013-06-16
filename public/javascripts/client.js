jQuery(function($) {
	"use strict";
	var socket = io.connect('http://'+location.host + '/');
	
	//createイベントを受信した時、html上にメモを作成する。
	socket.on('create',function(todoData){
		todoData.forEach(function(data){
			createTodo(data);
		});
	});
	//update-textイベントを受信した時、メモのテキストを更新する。
	socket.on('update-text',function(data){
		$('#'+data._id).find('.text').val(data.text);
	});
	//removeイベントを受信した時、メモを削除する。
	socket.on('remove',function(data){
		removeTodo(data._id);
	});
	//createボタンが押された時、新規メモを作成するようにcreateイベントを送信する。
	$('#create-button').click(function(){
		var todoData = {
		    type: 'will do',
		    text: '',
		    date: new Date(),
		};
		socket.emit('create',todoData);
	});
	//todoDataを元にメモをhtml上に生成
	//todoDataは{_id:String,text:String,position:{left:Number,top:Number}}の型
	var createTodo = function(todoData){
		var id = todoData._id;
		var old = $('#'+id);
		if(old.length !== 0){
			return;
		}
		
		var element =
			$('<ul class="todo"/>')
				.attr('id',id)
				.append($('<li class="settings"/>')
					.append('<a href="#" class="remove-button">☓</a>')
				)
				.append($('<li class="type"></li>')
					.text('[' + todoData.type + '] ')
				)
				.append($('<li class="text"></li>')
					.text(todoData.text)
				)
				.append($('<a href="#" class="edit">edit</a>')
				);
		element.hide().fadeIn();
		if (todoData.type === 'will do') {
			$('#will_area').append(element);
		} else if (todoData.type === 'doing') {
			$('#doing_area').append(element);
		} else {
			$('#done_area').append(element);
		}

		// editボタンを押したらtextarea表示
		$(document).on('click', '#' + id + ' .edit', function(){
			var typeDisplayed = $('#' + id + ' .type').text();
			var textDisplayed = $('#' + id + ' .text').text();
			var typePosted = "";
			var textPosted = "";

			// 編集モードに切り替える
			$('#' + id + ' .type').replaceWith('<select class="type" name=\"' + id + '\"/>');
			$('#' + id + ' .type').append('<option class=\"will\" value=\"1\">will do</option>')
			$('#' + id + ' .type').append('<option class=\"doing\" value=\"2\">doing</option>')
			$('#' + id + ' .type').append('<option class=\"done\" value=\"3\">done</option>')
			$('#' + id + ' .text').replaceWith('<textarea class="text"/>');
			$('#' + id + ' .text').val(textDisplayed);
			$('#' + id + ' .edit').replaceWith('<a href="#" class="finish">finish</a>');

			// selectタグのselectedを設定
			if(typeDisplayed === '[will do] ') {
				$("select[name=\"" + id + "\"]").val(1);
			} else if (typeDisplayed === '[doing] ') {
				$("select[name=\"" + id + "\"]").val(2);
			} else {
				$("select[name=\"" + id + "\"]").val(3);
			}

			// selectタグのselectedになっている中身を取得
			$("select[name=\"" + id + "\"]").change(function () {
				$("select option:selected").each(function () {
					typePosted = $(this).text();
				});
			})
			.trigger('change');

			// finishボタンを押したらtextarea非表示
			$('#' + id + ' .finish').on('click', function(){
				// var typePosted = $('#' + id + ' .type').val();
				textPosted = $('#' + id + ' .text').val();
				//テキストが変更された場合、update-textイベントを送る。
				console.log(typePosted);
				var submit = {'type':typePosted, 'text':textPosted};
				socket.emit('update-text',{_id:id,type:submit.type,text:submit.text});
				// 表示モードに切り替える
				$('#' + id + ' .type').replaceWith('<span class="type"/>');
				$('#' + id + ' .type').text('[' + typePosted + '] ');
				$('#' + id + ' .text').replaceWith('<span class="text"/>');
				$('#' + id + ' .text').text(textPosted);
				$('#' + id + ' .finish').replaceWith('<a href="#" class="edit">edit</a>');
			});
		});

		//☓ボタンを押した場合removeイベントを送る
		element.find('.remove-button').click(function(){
			socket.emit('remove',{_id:id});
			removeTodo(id);
			return false;
		});
	};
	var removeTodo = function(id){
		$('#'+id).fadeOut('fast').queue(function(){
			$(this).remove();
		});
	};
});