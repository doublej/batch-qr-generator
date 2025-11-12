import Dialog from './dialog.svelte'

// Create wrapper components for better API
import { type Component } from 'svelte'

export { Dialog }

export const DialogContent: Component<any> = (props: any) => {
  // This is just a div wrapper for content structure
  return props
}

export const DialogHeader: Component<any> = (props: any) => {
  // This is just a div wrapper for header structure
  return props
}

export const DialogTitle: Component<any> = (props: any) => {
  // This is just an h2 wrapper for title
  return props
}

export const DialogDescription: Component<any> = (props: any) => {
  // This is just a p wrapper for description
  return props
}