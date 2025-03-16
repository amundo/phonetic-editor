import {DOMParser} from 'jsr:@b-fuze/deno-dom'

const html = Deno.readTextFileSync('typeit.org-ipa.html')
const doc = (new DOMParser()).parseFromString(html, 'text/html')


const bigScreen = doc.querySelector('.big-screen')
const keyblocks = Array.from(bigScreen.querySelectorAll('.keyblock'))
  .filter(k => k.querySelector("label"))


const characters = keyblocks
  .map(keyblock => Array.from(keyblock.querySelectorAll("button"))
  .map(button => ({ 
    name: button.getAttribute('name').trim(), 
    title: button.getAttribute('title').trim(), 
    character: button.textContent.trim(), 
    like: keyblock.querySelector('label').textContent.trim() 
  })))
  .flat()

const metadata = {
  title: "Typeit.org IPA mnemonics",
  howto: "I copied the relevant HTML manuarlly because it is generated with JS on the site. Thensaved to typeit.org-ipa.html",
}


Deno.writeTextFile("typeit.org-ipa.json", JSON.stringify({metadata, characters}, null, 2))