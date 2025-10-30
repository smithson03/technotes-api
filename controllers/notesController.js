const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find().lean()
  
  if(!notes?.length) {
    return res.status(400).json({message: 'No notes found'})
  }

  const notesWithUser = await Promise.all(notes.map(async (note) => {
    const user = await User.findById(note.user).lean().exec()
    return {...note, username: user.username}
  }))

  res.json(notesWithUser)
})

// @desc Create new notes
// @route POST /notes
// @access Private
const createNewNote = asyncHandler(async (req, res) => {
  const { user, title, text } = req.body

  // Confirm data
  if(!user || !title || !text) {
    return res.status(400).json({message: 'All fields are required'})
  }

  // Check for duplicate notes
  const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()
  if(duplicate) {
    return res.status(400).json({message: 'Duplicate note title'})
  }

  const noteObject = { user, title, text }

  // Create and save note
  const note = await Note.create(noteObject)
  if (note) {// created
    return res.status(201).json({message: `New note ${title} created`})  
  } else {
    res.status(400).json({message: 'Invalid note data received'})
  }
})

// @desc Update a notes
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
  const { id, user, title, text, completed } = req.body

  // Confirm data
  if(!user || !id || !title || !text || typeof completed !== 'boolean') {
    res.status(400).json({message: 'All fields are required'})
  }

  const note = await Note.findById(id).exec()

  if(!note) {
    res.status(400).json({message: 'Note not found'})
  }

  // Check for duplicates
  const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()
  // Allow updates to original note
  if(duplicate && duplicate?._id.toString() !== id) {
    res.status(400).json({message: 'Duplicate note title'})
  }

  note.title = title
  note.user = user
  note.completed = completed
  note.text = text

  const updatedNote = await note.save()

  res.json({message: `${updatedNote.title} updated`})
})

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.body

  if(!id) {
    res.status(400).json({message: 'Note ID required'})
  }

  const note = await Note.findById(id).exec()

  if(!note) {
    res.status(400).json({message: 'Note not found'})
  }

  const result = await note.deleteOne()

  res.json({message: `Note deleted`})
})

module.exports = {
  getAllNotes,
  createNewNote,
  updateNote,
  deleteNote
}