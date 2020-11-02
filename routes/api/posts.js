const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {check, validationResult} = require('express-validator');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const { json } = require('express');
const { restart } = require('nodemon');


// @route  POST api/posts
// @desc   Create a post
// @access Private
router.post('/',[auth, [
    check('text','Text is required').not().isEmpty()
]], async (req,res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }
        try {
            const user = await User.findById(req.user.id).select('-password');
            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            });
            const post = await newPost.save();
            return res.json(post);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
       

    });

// @route  GET api/posts
// @desc   Get all posts
// @access Private
router.get('/',auth, async (req,res)=>{
    try {
        const posts = await Post.find().sort({
            date: -1
        });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});

// @route  GET api/posts/:id
// @desc   Get post by id
// @access Private
router.get('/:id',auth, async (req,res)=>{
    try {
        const post = await Post.findById(req.params.id);
        if (!post){
            return res.status(404).json({
                msg: 'Post Not Found'
            });
        }
        return res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId'){
            return res.status(400).json({
                msg: 'Post not found'
            });
        }
        return res.status(500).send('Server Error');
    }
});


// @route  DELETE api/posts/:id
// @desc   Delete post by id
// @access Private
router.delete('/:id',auth, async (req,res)=>{
    try {
        const post = await Post.findById(req.params.id);
        if (!post){
            return res.status(404).json({
                msg: 'Post Not Found'
            });
        }
        //check if user is correct
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({
                msg: 'User not authorized to delete this post'
            });
        }
        await post.remove();
        return res.json({
            msg:'Post Removed'
        });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId'){
            return res.status(400).json({
                msg: 'Post not found'
            });
        }
        return res.status(500).send('Server Error');
    }
});


// @route  PUT api/posts/like/:id
// @desc   Like post by id
// @access Private
router.put('/like/:id',auth, async (req,res)=>{
try {
    const post = await Post.findById(req.params.id);

    //check if post has already been liked by this user
    if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
        return res.status(400).json({msg: 'Post Already Liked'});
    }
    post.likes.unshift({
        user: req.user.id
    });
    await post.save();
    return res.json(post.likes);
} catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId'){
        return res.status(400).json({
            msg: 'Post not found'
        });
    }
    res.status(500).send('Server error');
    
}
});

// @route  PUT api/posts/unlike/:id
// @desc   unLike post by id
// @access Private
router.put('/unlike/:id',auth, async (req,res)=>{
    try {
        const post = await Post.findById(req.params.id);
    
       const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
       post.likes.splice(removeIndex,1);
        await post.save();
        return res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId'){
            return res.status(400).json({
                msg: 'Post not found'
            });
        }
        res.status(500).send('Server error');
        
    }
    });
    

// @route  POST api/posts/comment/:id
// @desc    comment on a post by id
// @access Private
router.post('/comment/:id',[auth, [
    check('text','Text is required').not().isEmpty()
]], async (req,res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }
        try {
            const user = await User.findById(req.user.id).select('-password');
            const post = await Post.findById(req.params.id);
            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            };
            post.comments.unshift(newComment);
            await post.save();
            return res.json(post.comments);
        } catch (err) {
            console.error(err.message);
            if (err.kind === 'ObjectId'){
                return res.status(400).json({
                    msg: 'Post not found'
                });
            }
            return res.status(500).send('Server Error');
        }
       

    });
// @route  DELETE api/posts/comment/:id/:comment_id
// @desc    DELETE comment on a post by id
// @access Private
router.delete('/comment/:id/:comment_id',auth,async (req,res) =>{
    try {
        const post = await Post.findById(req.params.id);
        //get comment from post
        const comment = post.comments.find(comment => comment.id=== req.params.comment_id);
        if (!comment){
            return res.status(404).json({
                msg: 'Comment not found'
            });
        }
        //make sure user is right
        if (comment.user.toString() !== req.user.id){
            return res.status(401).json({
                msg: 'User not authorized to delete this comment'
            });
        }
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
        post.comments.splice(removeIndex,1);
         await post.save();
         return res.json(post.comments);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId'){
            return res.status(400).json({
                msg: 'Post not found'
            });
        }
    }
})
module.exports = router;