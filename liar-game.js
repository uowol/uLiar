
'use strict';

const {Client, MessageEmbed } = require('discord.js');
const token = require('./token.json');
const cards = require('./cards.json');
const fs = require('fs');


// const readline = require("readline");
// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });
const log = (str) => {
    console.log("====LOG====")
    console.log(str);
}


class LiarGame{
    constructor(cards, people_num=4) {
        this.cards = cards;
        this.category = '';
        this.peopleNum = people_num;
        this.keywords = [];
        // this.keywordsChanged = false;
    }
    set category(c){
        this._category = c;
        this.keywords = this.cards[c] ? this.cards[c].keywords : []; // if there's no category, make new keywords([]) and add it next(in save function)

        this.save(); // update now category & keywords

    }
    get category(){
        return this._category;
    }
    save(){
        log('save() Called!')
        // check the category is exist
        if(!this.cards[this.category]){
            this.cards[this.category] = {
                keywords: this.keywords,
                length: this.keywords.length
            }
        }
        // check keywords are changed,
        // if(this.keywordsChanged){
        //     // this.cards[this.category].keywords = this.keywords; // already changed???
        //     this.cards[this.category].length = this.keywords.length;
        //     this.keywordsChanged = false;
        // }
    }
    insertKeyword(keyword){
        if(this.keywords.length >= 20 || this.keywords.includes(keyword)) return false;
        this.keywords.push(keyword);
        this.cards[this.category].length++;
        // this.keywordsChanged = true;
    }
    removeKeyword(keyword){
        if(this.keywords.length === 0) return false;
        for(let i=0; i<this.keywords.length; i++){
            if(this.keywords[i] === keyword){
                this.keywords.splice(i, 1);
                // this.keywordsChanged = true;
                this.cards[this.category].length--;
                return true;
            }
        }
        return false;
    }
    #shuffle(){
        let keyword = this.keywords[Math.floor(Math.random()*this.keywords.length)]
        let res = new Array(this.peopleNum).fill(keyword);
        res[Math.floor(Math.random()*this.peopleNum)] = 'Liar(라이어)';
        return res;
    }
    start(){
        if(this.keywords.length === 0) return {status: false, content: 'error'};
        this.pool = this.#shuffle();
    }
    extract(){
        if(!this.pool || this.pool.length === 0) return "남은 카드가 없습니다.";
        return this.pool.shift();
    }
    static saveChanges(){
        fs.writeFileSync('./cards.json', JSON.stringify(cards, null, 4), 'utf8'); // save changes
    }
    static update(){
        // read cards.json file again.
    }
}
const test = (game) => {
    game.category = '테스트'

    for(let i=0;i<30;i++) game.insertKeyword("테스트 " + i) // 20개 이하로 들어가는 것 확인
    // game.insertKeyword('테스트 1')
    // game.insertKeyword('테스트 1') // duplicated
    // game.insertKeyword('테스트 2')
    // game.insertKeyword('테스트 3')

    for(let i=0;i<30;i++) game.removeKeyword("테스트" + i) // 20개 이하로 들어가는 것 확인
    game.removeKeyword('테스트 1');

    return 
}


const global = {
    game: null,
    isGameExist: false,
    isGameStarted: false
}

const bot = new Client();

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', msg => {
    let [trigger, content, factor] = msg.content.split(' ');
    if(trigger !== '!') return false;
    if (content === '라이어게임') {
        if(!factor){
            msg.reply('인원 수를 입력해주세요. [예시: ! 라이어게임 6]')
            return false;
        }
        if(global.game) delete global.game
        global.game = new LiarGame(cards, factor*1);   // cards, num_of_people
        global.isGameExist = true;
        msg.reply(`라이어 게임이 개설되었습니다. 현재 인원 ${factor}명`);
        return true;
    }
    

    if(!global.isGameExist) return false;


    if(content === '주제'){
        if(factor){
            global.game.category = factor;
        }
        // let str = Object.keys(global.game).map((v, idx) => ((idx+1) + '. ' + v)).join('\n');
        msg.reply(`현재 주제는 '${global.game.category}' 입니다.\n주제 List: ${Object.keys(cards).join(', ')}\n[! 주제 '추가할 주제'] 명령어를 사용해 주제를 추가할 수 있습니다.`);
        return true;
    }


    if(global.game.category === ''){
        msg.reply(`주제를 설정해 주세요. [예시: ! 주제 장소]\n[! 주제] 명령어를 치시면 현재 주제가 무엇인지 알 수 있습니다.`)
        return false;
    }


    if(content === '키워드'){
        if(factor){
            msg.reply(`키워드를 추가하시려면 [! 추가 '추가할 키워드'] 명령어를 사용해주세요.`);
            return false;
        }
        let str = global.game.keywords.map((v, idx) => ((idx+1) + '. ' + v)).join('\n');
        msg.reply(`현재 주제의 키워드들은 다음과 같습니다.\n${str}\n[! 추가 '추가할 키워드'] 명령어를 사용해 키워드를 추가할 수 있습니다.`);
    }

    if(content === '추가'){
        if(!factor){
            msg.reply(`키워드를 추가하시려면 [! 추가 '추가할 키워드'] 명령어를 사용해주세요.`);
            return false;
        }
        global.game.insertKeyword(factor);
        let str = global.game.keywords.map((v, idx) => ((idx+1) + '. ' + v)).join('\n');
        msg.reply(`\n${str}\n⚠ 키워드는 중복되지 않고 20개 이하로 입력 가능합니다.`)
    }

    if(content === '제거'){
        if(!factor){
            msg.reply(`키워드를 제거하시려면 [! 제거 '제거할 키워드'] 명령어를 사용해주세요.`);
            return false;
        }
        global.game.removeKeyword(factor);
        let str = global.game.keywords.map((v, idx) => ((idx+1) + '. ' + v)).join('\n');
        msg.reply(`\n${str}`)

    }

    if(content === '시작'){
        global.game.start();
        msg.reply('카드가 생성되었습니다. [! 카드] 명령어를 입력해 자신의 카드를 확인하세요!');
        global.isGameStarted = true;
    }


    if(!global.isGameStarted) {
        msg.reply("게임을 시작하시려면 [! 시작] 명령어를 입력하세요.\n게임을 종료하실 때 [! 종료] 명령어를 치시면 변동사항(삭제 및 추가된 정보들)이 저장됩니다.");
    }


    if(content === '카드'){
        let user = msg.author;
        let card = global.game.extract();
        user.send(`당신의 카드에 적혀있는 키워드는 *${card}* 입니다.`)
    }

    if(content === '종료'){
        msg.reply('변동 사항을 저장합니다. 플레이해주셔서 감사합니다.');
        LiarGame.saveChanges();
        global.isGameStarted = false;
    }

});

bot.login(token.token);

// console.log(game.start());

// LierGame.saveChanges();


// rl.close();
// rl.on('line', function(line) {
//     if(line === '!get') log(a.extract())
//     else rl.close();
// }).on("close", function() {
//     process.exit();
// });