(function(){
	var static = [
		'/vendor/jquery/dist/jquery.min.js',
		'/vendor/bootstrap/dist/css/bootstrap.min.css',
		'/vendor/bootstrap/dist/js/bootstrap.min.js',
		'/vendor/fontawesome/css/font-awesome.min.css',
		'/vendor/angular/angular.min.js',
		'/vendor/angular-fontawesome/dist/angular-fontawesome.min.js',
		'/vendor/angular-animate/angular-animate.min.js',
		'/vendor/angular-motion/dist/angular-motion.min.css',
		'/vendor/angular-strap/dist/angular-strap.min.js',
		'/vendor/angular-strap/dist/angular-strap.tpl.min.js',
		'/vendor/angular-socket-io/socket.min.js',
		'/vendor/sugar/release/sugar-full.min.js',
		'/socket.io/socket.io.js',
		'/css/master.css',
		'/js/application.js'
	];

	function runApplication(socketio){
		var timeout = 200;
		app.run(socketio);
		$('.spinner').fadeOut(timeout, function(){
			$('.application').fadeIn(timeout);
			$(this).remove();
		});
	}

	function afterLoading(){
		var socketio = io();
		app.init(socketio);
		socketio.emit('handshake.client');
		socketio.on('handshake.server', function(){
			$(function(){runApplication(socketio)});
		});
	}

	yepnope({
		load     : static,
		complete : afterLoading
	});

})();
