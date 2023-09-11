"use strict";

(function() {

	var Playground = {

		processing: false,
		editor: null,

		isDarkModeEnabled: function() {
			return document.querySelector('html').getAttribute('data-bs-theme') === 'dark';
		},

		setEditorDarkMode: function(dark = false) {
			if (dark) {
				this.editor.setTheme("ace/theme/tomorrow_night");
			} else {
				this.editor.setTheme("ace/theme/chrome");
			}
		},

		init: function() {
			var that = this;

			console.log("Initializing Ace editor.");
			var editor = ace.edit("editor");
			editor.getSession().setUseSoftTabs(true);
			editor.getSession().setTabSize(2);
			editor.setFontSize(14);

			this.editor = editor;
			this.setEditorDarkMode(this.isDarkModeEnabled());

			// Listen for theme changes.
			document.addEventListener('bsThemeChanged', (e) => {
				this.setEditorDarkMode(e.detail.theme === 'dark');
			});

			// Listen for and save checkbox changes.
			var compilerOutputCheckbox = document.getElementById("compiler-output");
			compilerOutputCheckbox.addEventListener("change", function() {
				localStorage.setItem("compilerOutput", this.checked);
			});

	    	// Restore last code, if found.
	    	var code = localStorage.getItem("lastCode");
	    	var compilerOutput = localStorage.getItem("compilerOutput");
				compilerOutputCheckbox.checked = compilerOutput === "true";
	    	if (code) {
	    		console.log("restoring code")
	    		this.editor.setValue(code);
				this.editor.clearSelection();
	    	}

	    	$(".runner").click(function(evt) {
	    		that.execute();		
	    	});

	    	// Allow submit with ctrl-enter.
	    	$("#editor").keydown(function(evt) {
	    		if (evt.ctrlKey && evt.keyCode === 13) {
	    			that.execute()
	    		}
	    	});

	    	// Navigation callbacks.
	    	$("#show-pg").click(function() {
	    		that.showPlayground();
	    	});
	    	$("#show-history").click(function() {
	    		that.showHistory();
	    	});
	    	$("body").on("click", ".history-edit", function() {
	    		var index = parseInt($(this).attr("data-id"));
	    		var item = JSON.parse(localStorage.getItem("pgHistory"))[index];
	    		
	    		that.editor.setValue(item.code);
				that.editor.clearSelection();
	    		$("#result").html(item.result);

	    		that.showPlayground();
	    	});

	    	// Clear history.
	    	$("#clear-history").click(function() {
	    		localStorage.setItem("pgHistory", null);
	    		that.showHistory();
	    	});
		},

		showPlayground: function() {
			$("#history").css("display", "none");
			$("#playground").css("display", "block");
			$("#main-nav .nav-link").removeClass("active");
			$("#show-pg").addClass("active");
		},

		showHistory: function() {
			$("#playground").css("display", "none");
			$("#history").css("display", "block");
			$("#main-nav .nav-link").removeClass("active");
			$("#show-history").addClass("active");

			var jsonHistory = localStorage.getItem("pgHistory");
			var history = JSON.parse(jsonHistory);
			history = history || [];

			if (history.length < 1) {
				$("#history-list").html('<li class="list-group-item">No entries yet.</li>');
			} else {
				var html = "";
				for (var i = history.length - 1; i >= 0; i--) {
					var item = history[i];
					var h = '<li class="list-group-item"><div class="row">';
					var date = new Date(item.time);

					h += '<div class="col-xs-3">' + date.toISOString().replace("T", " ").substr(0, 19) + "</div>";

					var btnClass = "label label-" + (item.status === "success" ? "success" : "danger");
					var status = item.status === "success" ? "OK" : "Error";

					h += '<div class="col-xs-3"><span class="' + btnClass + '">' + status + "</span>" + "</div>";

					h += '<div class="col-xs-3"><button class="btn btn-md btn-primary history-edit" data-id="' + i + '">Edit</button></div>'; 

					h += "</div></li>"

					html += h;
				}
				$("#history-list").html(html);
			}
		},

		execute: function() {
			if (this.processing) {
				return;
			}

      var that = this;

			var code = this.editor.getValue().trim();
			if (code !== "") {
				// Save code to localstorage.
				localStorage.setItem("lastCode", code);

				$(".show-on-loading").css("display", "inline-block");
				$(".hide-on-loading").css("display", "none");
				$(".runner").attr("disabled", "");
				this.setStatus("Processing...", "warning");
        $("#result").html("");

				$.ajax({
          url: "/api/execute",
          method: "POST",
					data: JSON.stringify({
						compilerOutput: document.getElementById("compiler-output").checked,
						code,
					}),
					contentType: "application/json; charset=utf-8",
				}).then(function(data) {
          console.log("Parsing json response ", data);
          data = JSON.parse(data);
          console.log("Parsed json: ", data);

					if (data.status === "success") {
						var msg = "Compilation took " + data.compileTime + "s" + ", " + "execution " + data.executionTime + "s";
						that.setStatus(msg, "success");
					} else if (data.status === "compileError") {
						var msg = "Compilation error";
						that.setStatus(msg, "danger")
					} else if (data.status === "executionError") {
						var msg = "Compilation succeded but execution failed";	
						that.setStatus(msg, "danger");
					}

					var jsonHistory = localStorage.getItem("pgHistory");
					var history = JSON.parse(jsonHistory);
					history = history || [];
					if (history.length > 300) {
						history = history.slice(0, 300);
					}
					history.push({
						code: code,
						time: new Date().getTime(),
						status: data.status,
						result: data.result
					});
					localStorage.setItem("pgHistory", JSON.stringify(history));

					function htmlEncode(html){
						return $("<div/>").text(html).html();
					}

					$("#result").html(htmlEncode(data.result));

					$(".show-on-loading").css("display", "none");
					$(".hide-on-loading").css("display", "inline-block");
					$(".runner").removeAttr("disabled");

				}, function(err) {
					that.setStatus("An error occurred", "error");
					$(".show-on-loading").css("display", "none");
					$(".hide-on-loading").css("display", "inline-block");
					$(".runner").removeAttr("disabled");
				});
			}
		},

		setStatus(msg, typ) {
			$("#status-alert").html(msg).attr("class", "alert alert-" + typ);
		}
	};

	$(function() {
		Playground.init();
	});

})(this);
