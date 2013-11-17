/**
 * The MIT License
 * 
 * Copyright (c) 2013 Studio Sóton ( http://studiosoton.com ) by: Daniel Furini -
 * dna.furini[at]gmail.com
 * 
 * Collaborate Fernando La Chica (@FernandoLaChica) fernandolachica[at]gmail.com
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */
var FaceGap = {
	config : {
		app_id : "",
		secret : "",
		host : "",
		scope : "email",
		onLogin : "",
		onLogout : ""
	},
	facebook_graph : "https://graph.facebook.com",
	facebook_token : "",
	ref : '',
	ref_logout : '',
	_hasLogin : false,
	_username: '',
	_result : {
		status : "",
		data : "",
		token : "",
		message : ""
	},
	methods : {
		init : function(settings) {
			console.log('EVE: init');
			if (settings) {
				$$.extend(FaceGap.config, settings)
			}
			var authorize_url = FaceGap.facebook_graph
					+ "/oauth/authorize?type=user_agent&client_id="
					+ FaceGap.config.app_id + "&redirect_uri="
					+ FaceGap.config.host
					+ "/connect/login_success.html&display=touch&scope="
					+ FaceGap.config.scope;
			FaceGap.ref = window.open(authorize_url, "_blank", "location=no");
			FaceGap.ref.addEventListener("loadstart", function(event) {
				FaceGap.methods.changeLogin(event.url)
			});
			FaceGap.ref.addEventListener("loadstop", function(event) {
				FaceGap.methods.parseStop(event.url);
			});
			FaceGap.ref.addEventListener("loaderror", function(event) {
				FaceGap.ref.close();
				console.log('ERR: onloaderror');
				if (FaceGap.methods._isFunction(FaceGap.config.onLogin)) {
					FaceGap._result.status = 0;
					FaceGap._result.data = null;
					FaceGap._result.message = event.message;
					FaceGap._result.token = "";
					FaceGap.config.onLogin(FaceGap._result)
				}
			});
			FaceGap.ref.addEventListener("exit", function(event) {
				if (FaceGap.methods._isFunction(FaceGap.config.onLogin)) {
					FaceGap._result.status = 0;
					FaceGap._result.data = null;
					FaceGap._result.message = 'Facebook não retornou login';
					FaceGap._result.token = "";
					FaceGap.config.onLogin(FaceGap._result)
				}
			})
		},
		changeLogout : function(_url) {
			console.log('EVE: changeLogout');
			var return_url = _url;
			if (return_url == FaceGap.config.host
					+ "/connect/logout_success.html") {
				if (FaceGap.methods._isFunction(FaceGap.config.onLogout)) {
					FaceGap._result.status = 1;
					FaceGap._result.message = "Success";
					FaceGap.config.onLogout(FaceGap._result)
				}
			} else {
				console.log('UE: return_url: ' + return_url + ' FaceGap.config.host: ' +FaceGap.config.host );
				if (FaceGap.methods._isFunction(FaceGap.config.onLogout)) {
					console.log('ERR: onChangeLogout from unknown host');
					FaceGap._result.status = 0;
					FaceGap._result.message = "onChangeLogout received unknown host server";
					FaceGap.config.onLogout(FaceGap._result)
				}
			}
		},
		changeLogin : function(_url) {
			console.log('EVE: changeLogin');
			var return_url = _url;
			var arr_data = return_url.split("access_token=");
			if (arr_data.length > 0) {
				if (!(typeof arr_data[1] === 'undefined')) {
					FaceGap.facebook_token = arr_data[1].split("&")[0];
					FaceGap.methods.getMe(FaceGap.facebook_token)
				}
			}
		},
		parseStop : function(_url) {
			console.log('EVE: parseStop: ' + _url);
			var return_url = _url;
			$$
					.ajax({
						type : 'GET',
						url : return_url,
						dataType : "json",
						async : true,
						cache : false,
						success : function(data, status) {
								var return_url = _url;
								var arr_data = _url.split("error=");
								if (arr_data.length > 0) {
									if (!(typeof arr_data[1] === 'undefined')) {
										var errorType = arr_data[1].split("&")[0];
										if (errorType == 'access_denied') {
											if (FaceGap.methods._isFunction(FaceGap.config.onLogin)) {
												FaceGap._result.status = 0;
												FaceGap._result.data = null;
												FaceGap._result.message = "Facebook no devolvió login";
												FaceGap._result.token = "";
												FaceGap.config.onLogin(FaceGap._result);
												FaceGap.ref.close();
											}
										}
									}
								}
						},
						error : function(data, status) {
							console.log('Something went wrong');
						}
					})
		},
		getMe : function(_t) {
			console.log('EVE: getMe');
			if (!FaceGap._hasLogin) {
				var url_me = "https://graph.facebook.com/me?access_token=" + _t;
				$$
						.ajax({
							type : 'GET',
							url : url_me,
							dataType : "json",
							async : true,
							cache : false,
							success : function(data) {
								FaceGap.ref.close();
								FaceGap._hasLogin = true;
								FaceGap._username = data.username;
								if (FaceGap.methods
										._isFunction(FaceGap.config.onLogin)) {
									FaceGap._result.status = 1;
									FaceGap._result.data = data;
									FaceGap._result.message = "Success";
									FaceGap._result.token = _t;
									FaceGap.facebook_token = _t;
									show_props(data, 'GetMe.dataResponse');
									FaceGap.config.onLogin(FaceGap._result)
								}
							},
							error : function(xhr, type) {
								console.log('Error on getme ajax call');
								FaceGap.ref.close();
								if (FaceGap.methods
										._isFunction(FaceGap.config.onLogin)) {
									console.log('ERR: on getme ajax call');
									FaceGap._result.status = 0;
									FaceGap._result.data = null;
									FaceGap._result.message = "Error get info user";
									FaceGap._result.token = "";
									FaceGap.config.onLogin(FaceGap._result)
								}
							}
						});
			} else {
				if (FaceGap.methods._isFunction(FaceGap.config.onLogin)) {
					console.log('ERR: HasLogin yet');
					FaceGap.ref.close();
					FaceGap._result.status = 0;
					FaceGap._result.data = null;
					FaceGap._result.message = "";
					FaceGap.config.onLogin(FaceGap._result);
				}
			}
		},
		logout : function() {
			console.log('EVE: logout');
			if (FaceGap.facebook_token != "") {
				var url_logout = 'https://graph.facebook.com/' + FaceGap._username + '/permissions?access_token=' + FaceGap.facebook_token;
				console.log('Logout received url: ' + url_logout);
				$$.delete(url_logout,
						{},
						function(data, status) {
							if (FaceGap.methods._isFunction(FaceGap.config.onLogout)) {
								FaceGap.methods.changeLogout(FaceGap.config.host + "/connect/logout_success.html");
							}
						}
				);
			} else {
				if (FaceGap.methods._isFunction(FaceGap.config.onLogout)) {
					console.log('ERR: logout without token');
					FaceGap._result.status = 0;
					FaceGap._result.message = "No user in session";
					FaceGap.config.onLogout(FaceGap._result)
				}
			}
		},
		fb_api : function(_config) {
			console.log('EVE: fb_api');
			if (FaceGap.facebook_token != "") {
				var url_me = FaceGap.facebook_graph + "" + _config.path
						+ "?access_token=" + FaceGap.facebook_token;
				console.log('Facebook_token: ' + FaceGap.facebook_token);
				$$.ajax({
					type : 'GET',
					url : url_me,
					dataType : "json",
					data : _config.params,
					async : false,
					cache : false,
					success : function(response, status) {
						if (FaceGap.methods._isFunction(_config.cb)) {
							FaceGap._result.status = 1;
							FaceGap._result.message = "success";
							FaceGap._result.data = response;
							_config.cb(FaceGap._result)
						}
					},
					error : function() {
						console.log('Error response getting fb_api access')
						if (FaceGap.methods._isFunction(_config.cb)) {
							console.log('ERR: error on get fb_api ajax call');
							FaceGap._result.status = 0;
							FaceGap._result.message = "fb_api service return error";
							FaceGap._result.data = null;
							_config.cb(FaceGap._result)
						}
					}
				})
			} else {
				if (FaceGap.methods._isFunction(_config.cb)) {
					console.log('ERR: get fb_api without token');
					FaceGap._result.status = 0;
					FaceGap._result.message = "No user in session";
					FaceGap._result.data = null;
					_config.cb(FaceGap._result)
				}
			}
		},
		_getParameter : function(name, _url) {
			console.log('EVE: _getParameter');
			name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
			var regexS = "[\\?&]" + name + "=([^&#]*)";
			var regex = new RegExp(regexS);
			var results = regex.exec(_url);
			if (results == null) {
				return ""
			} else {
				return results[1]
			}
		},
		_isFunction : function(functionToCheck) {
			console.log('EVE: _isFunction, next log show function code');
			console.log(functionToCheck);
			var getType = {};
			return functionToCheck
					&& getType.toString.call(functionToCheck) == "[object Function]"
		}
	}
};

$$.fn.FaceGap = function(method) {
	console.log('EVE: FaceGap: ' + method);
	if (FaceGap.methods[method]) {
		return FaceGap.methods[method].apply(this, Array.prototype.slice.call(
				arguments, 1))
	} else {
		if (typeof method === "object" || !method) {
			return FaceGap.methods.init.apply(this, arguments)
		} else {
			$$.error("Method " + method + " does not exist on quoJS.FaceGap")
		}
	}
}