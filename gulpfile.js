var gulp    = require('gulp'),
    rename  = require('gulp-rename'),
    gutil  = require('gulp-util'),
    uglify  = require('gulp-uglify'),
    karma = require('karma').server;

gulp.task('build', function () {
  return gulp.src('pathway.js')
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./'));
});

gulp.task('test', function (done) {
  karmaTest(['pathway.js', 'pathway.spec.js'], done);
});

gulp.task('test-min', function (done) {
  karmaTest(['pathway.min.js', 'pathway.spec.js'], done);
});

/**
 * Run karma tests once loading files provided
 *
 * @param  {Array<String>}  files Array of file patterns to load
 * @param  {Function}       done
 */
function karmaTest(files, done) {
  karma.start({
    browsers: ['Chrome', 'PhantomJS'],
    files: files,
    frameworks: ['jasmine'],
    singleRun: true
  }, function (exitCode) {
    gutil.log('Karma has exited with: ' + exitCode);
    done(exitCode);
  });
}
