$.ajax({
	url: "/4d/server/execScript/backup"
}).done(function(html){
	$(".span6").append(html);
});