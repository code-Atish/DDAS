document.addEventListener('click', (event) => {
    const element = event.target;
    if (element.tagName === 'A' && element.href) {
      console.log('Potential download link clicked:', element.href);
      // You could send this information to the background script for processing
    }
  });