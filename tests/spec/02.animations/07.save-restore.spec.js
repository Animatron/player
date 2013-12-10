// FIXME: test save-restore pairing:

/* var player = createPlayer('main',
                { mode: anm.C.M_DYNAMIC,
                  anim: { width: WIDTH,
                          height: HEIGHT } });

var scene = b('scene');

var prev_translate = player.ctx.translate;
player.ctx.translate = function() {
    console.log('translate', arguments);
    prev_translate.apply(player.ctx, arguments);
}
var prev_transform = player.ctx.setTransform;
player.ctx.setTransform = function() {
    console.log('setTransform', arguments);
    prev_transform.apply(player.ctx, arguments);
}
var prev_save = player.ctx.save,
    save_cnt = 0;
player.ctx.save = function() {
    console.log('save', save_cnt++, arguments);
    prev_save.apply(player.ctx, arguments);
}
var prev_restore = player.ctx.restore;
player.ctx.restore = function() {
    console.log('restore', --save_cnt, arguments);
    prev_restore.apply(player.ctx, arguments);
} */

// FIXME: test restore is called properly when exception is fired from the movie