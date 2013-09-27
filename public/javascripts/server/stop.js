$.ajax({
	url: "/4d/server/execScript/stop"
}).done(function(html){
	$(".span6").append(html);
});