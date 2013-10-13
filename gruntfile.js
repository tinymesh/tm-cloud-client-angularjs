module.exports = function (grunt) {

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');

	// Default task.
	grunt.registerTask('default', ['jshint','build']);
	grunt.registerTask('build', ['clean','concat:dist']);
	grunt.registerTask('dev', ['clean','concat','copy']);

	grunt.initConfig({
		distdir: 'dist',
		pkg: grunt.file.readJSON('package.json'),
		banner:
			'/*! <%= pkg.title || pkg.name %>-<%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd") %>)\n' +
			'<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
			' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;\n' +
			' * Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n */\n',
		src: {
			js: ['src/*.js'],
		},
		clean: ['<%= distdir %>/*'],
		copy: {
			npm: {
				files: [ {dest:    '<%= distdir %>',
				          src:     [
				            'underscore/underscore.js',
				            'json3/lib/json3.js'
				          ],
				          expand:  true,
				          flatten: true,
				          cwd:     'node_modules/'}]
			},
			vendor: {
				files: [ {dest:    '<%= distdir %>',
				          src: [ 'ngStorage/ngStorage.js' ],
				          expand:  true,
				          flatten: true,
				          cwd:     'vendor/'}]
			}
		},
		concat:{
			dist:{
				options: { banner: "<%= banner %>" },
				src: ['<%= src.js %>'],
				dest:'<%= distdir %>/<%= pkg.name %>.js'
			},
			angular: {
				src: ['vendor/angular/angular.js',
				      'vendor/angular/angular-route.js',
				      'vendor/angular/angular-resource.js',
				      'vendor/angular/angular-underscore.js'],
				dest: '<%= distdir %>/angular.js'
			},
			cryptojs: {
				src: [ 'vendor/crypto-js/rollups/sha256.js',
				       'vendor/crypto-js/components/enc-base64.js' ],
				dest: '<%= distdir %>/crypto.js'
			}
		},
		jshint:{
			files: ['gruntFile.js', '<%= src.js %>'],
			options:{
				curly:   true,
				eqeqeq:  true,
				immed:   true,
				latedef: true,
				newcap:  true,
				noarg:   true,
				sub:     true,
				boss:    true,
				eqnull:  true,
				es5:     true,
				globals: {"angular": false}
			}
		}
	});
};
