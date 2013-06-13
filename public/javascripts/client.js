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
	//moveイベントを受信した時、メモの位置をアニメーションさせる。
	socket.on('move',function(data){
		$('#'+data._id).animate(data.position);
	});
	//removeイベントを受信した時、メモを削除する。
	socket.on('remove',function(data){
		removeTodo(data._id);
	});
	//createボタンが押された時、新規メモを作成するようにcreateイベントを送信する。
	$('#create-button').click(function(){
		var todoData = {
		    type: '',
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
			$('<div class="todo"/>')
			.attr('id',id)
			.append($('<div class="settings">')
				.append('<a href="#" class="remove-button">☓</a>')
			)
			.append($('<div/>')
				.append($('<span class="type"></span>')
					.val(todoData.type)
				)
				.append($('<span class="text"></span>')
					.val(todoData.text)
				)
				.append($('<a href="#" class="edit">edit</a>')
				)
			);
		element.hide().fadeIn();
		$('#field').append(element);

		// editボタンを押したらtextarea表示
		$(document).on('click', '#' + id + ' .edit', function(){
			$('#' + id + ' .type').replaceWith('<textarea class="type"/>');
			$('#' + id + ' .text').replaceWith('<textarea class="text"/>');
			$('#' + id + ' .edit').replaceWith('<a href="#" class="finish">finish</a>');
			// finishボタンを押したらtextarea非表示
			$('#' + id + ' .finish').on('click', function(){
				$('#' + id + ' .type').replaceWith('<span class="type"/>');
				$('#' + id + ' .text').replaceWith('<span class="text"/>');
				$('#' + id + ' .finish').replaceWith('<a href="#" class="edit">edit</a>');
			});
		});
/*
		//メモをドラッグした時、moveイベントを送る。
		//(jQuery UIを使用)
		element.draggable({stop:function(e,ui){
			var pos = {
				left:ui.position.left
				,top:ui.position.top
			};
			socket.emit('move',{_id:id,position:pos});
		}});
*/
		//テキストが変更された場合、update-textイベントを送る。
		var $text = element.find('.text');
		console.log($text.val());
		$text.keyup(function(){
			socket.emit('update-text',{_id:id,text:$text.val()});
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