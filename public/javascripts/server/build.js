$.ajax({
	url: "/4d/server/execScript/build"
}).done(function(html){
	$(".span6").append(html);
});