import React from 'react'
import BlogContent from './BlogContent'
import BlogReader from './BlogReader'

export default function BlogCombine() {
    return (
        <div>
            <BlogReader />
            <BlogContent />
        </div>
    )
}
