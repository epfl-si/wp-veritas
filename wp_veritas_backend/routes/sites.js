const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi'); // validate user data from REST API

const router  = express.Router();

const openshift_env_list = ['www', 'subdomains', 'sandbox'];
const type_list = ['private', 'public', 'unmanaged'];
const theme_list = ['2018', '2018-light'];
const faculty_list = ['CDH', 'CDM', 'ENAC', 'IC', 'SB', 'STI', 'SV'];
const language_list = ['fr', 'en'];

const siteSchema = mongoose.Schema({
    url: {
        type: String,
        required: true,
        maxlength: 255
    },
    tagline: {
        type: String,
        required: true,
        maxlength: 255
    },
    title: {
        type: String,
        required: true,
        maxlength: 255
    },
    openshift_env: {
        type: String,
        required: true,
        enum: this.openshift_env_list
    },
    type: {
        type: String,
        required: true,
        enum: this.type_list
    },
    
    theme: {
        type: String,
        required: true,
        enum: this.theme_list
    },
    
    faculty: {
        type: String,
        required: true,
        enum: this.faculty_list
    },
    language: {
        type: String,
        required: true,
        enum: this.language_list
    },
    unit_id: {
        type: String,
        required: true,
    },
    snow_number: {
        type: String,
        required: true,
        maxlength: 255
    },

});

const Site = new mongoose.model('Site', siteSchema);

// Get all sites
router.get('/', async (req, res) => {
    const sites = await Site.find().sort('url');
    res.send(sites);
});

// Get site with id ':id'
router.get('/:id', async (req, res) => {

    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).send('The site with the given ID was not found');

    res.send(site);
})

// Post a new site
router.post('/', async (req, res) => {

    console.log(req.body);

    // Validate site
    const { error } = validateSite(req.body);
    if (error) return res.status(400).send(error)

    // Create the new site
    let site = new Site(
        { 
            url: req.body.url,
            tagline: req.body.tagline,
            title: req.body.title,
            openshift_env: req.body.openshift_env,
            type: req.body.type,
            theme: req.body.theme,
            faculty: req.body.faculty,
            language: req.body.language,
            unit_id: req.body.unit_id,
            snow_number: req.body.snow_number
        }
    );
    site = await site.save();
    
    res.send(site);
});

// Put a site
router.put('/:id', async (req, res) => {

    // Validate user data
    const { error } = validateSite(req.body);
    if (error) return res.status(400).send(error)

    console.log(req.body);

    // Update 
    const site = await Site.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!site) return res.status(404).send('The site with the given ID was not found');

    res.send(site);
});

// Delete a site
router.delete('/:id', async (req, res) => {
    const site = await Site.findByIdAndRemove(req.params.id);
 
    if (!site) return res.status(404).send('The Site with the given ID was not found');

    res.send(site);
});

function validateSite(site) {
    const schema = {
        url: Joi.string().required(),
        tagline: Joi.string().required(),
        title: Joi.string().required(),
        openshift_env: Joi.string().valid(openshift_env_list),
        type: Joi.string().valid(type_list),
        theme: Joi.string().valid(theme_list),
        faculty: Joi.string().valid(faculty_list),
        language: Joi.string().valid(language_list),
        unit_id: Joi.string().required(),
        snow_number: Joi.string().required()
    };
    return Joi.validate(site, schema);
}

module.exports = router; 