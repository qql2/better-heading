/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */

import { Editor, MarkdownView, Notice } from 'obsidian';

import BetterHeading from './main';
import { CodeBlockJudge } from 'code-block-judge';
import { EnhancedEditor } from 'enhanced-editor'

export class HeadingServer {
    plugin: BetterHeading;
    readonly HeadingTagRegex = /^#{0,6} ?(?=.)/gm;
    constructor(plugin: BetterHeading) {
        this.plugin = plugin
        this.addCommand()
    }
    addCommand() {
        this.plugin.addCommand({
            id: "批量提高标题层级HigherHeading",
            name: "批量提高标题层级HigherHeading",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.changeHeadingLevel(editor, true)
            }
        });
        this.plugin.addCommand({
            id: "批量降低标题层级LowerHeading",
            name: "批量降低标题层级LowerHeading",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.changeHeadingLevel(editor, false)
            }
        });
        this.plugin.addCommand({
            id: "设置标题Heading为1级",
            name: "设置标题Heading为1级",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.SetHeadingLevel(1, editor);
            }
        });
        this.plugin.addCommand({
            id: "设置标题Heading为2级",
            name: "设置标题Heading为2级",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.SetHeadingLevel(2, editor);
            }
        });
        this.plugin.addCommand({
            id: "设置标题Heading为3级",
            name: "设置标题Heading为3级",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.SetHeadingLevel(3, editor);
            }
        });
        this.plugin.addCommand({
            id: "设置标题Heading为4级",
            name: "设置标题Heading为4级",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.SetHeadingLevel(4, editor);
            }
        });
        this.plugin.addCommand({
            id: "设置标题Heading为5级",
            name: "设置标题Heading为5级",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.SetHeadingLevel(5, editor);
            }
        });
        this.plugin.addCommand({
            id: "设置标题Heading为6级",
            name: "设置标题Heading为6级",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.SetHeadingLevel(6, editor);
            }
        });
        this.plugin.addCommand({
            id: "循环标题Heading层级",
            name: "循环标题Heading层级",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.CycleHeadingLevel(editor);
            }
        });
    }
    changeHeadingLevel(editor: Editor, higher: boolean) {
        let enhancedEditor = new EnhancedEditor(editor)
        const HeadingNotOneRegex = /(?<=\n|^)#{2,6} /g;
        const HeadingNotSixRegex = /(?<=\n|^)#{1,5} /g;
        let { endPos: endPos, startPos: startPos, txt: rawin } = enhancedEditor.GetMultiLineInSelection();
        let wholeText = editor.getValue()
        let YAMLPOS = this.getYAMLPos(wholeText);
        let textDone = rawin.replace(higher ? HeadingNotOneRegex : HeadingNotSixRegex, (matChars: string, offset: number) => {
            let index = offset + editor.posToOffset(startPos)
            const yaml = this.IsYAML(index, startPos.line, YAMLPOS);
            const code = CodeBlockJudge.IsInAnyCodeBlock(wholeText, index);
            if (yaml || code) return matChars;
            let len = matChars.length;
            let result = '#';
            for (let i = 1; i <= len - (higher ? 3 : 1); ++i)result += '#';
            return result + ' ';
        })
        editor.replaceRange(textDone, startPos, endPos);
    }
    SetHeadingLevel(level: number, editor: Editor): void {
        let NewHeadingTag = " ";
        let Line1 = editor.getCursor("from").line;
        let Line2 = editor.getCursor("to").line;
        if (Line2 < Line1) { let temp = Line1; Line2 = Line1; Line2 = temp }
        for (let i = 1; i <= level; ++i)NewHeadingTag = "#" + NewHeadingTag
        for (; Line1 <= Line2; ++Line1) {
            let result = editor.getLine(Line1).replace(this.HeadingTagRegex, NewHeadingTag);
            editor.setLine(Line1, result);
        }
    }
    CycleHeadingLevel(editor: Editor) {
        let pos1 = editor.getCursor('from');
        let pos2 = editor.getCursor('to');
        if (pos1.ch != pos2.ch || pos1.line != pos2.line) {
            /*更改多行*/
            if (pos2.line < pos1.line) { let temp = pos2; pos2 = pos1; pos1 = temp; }
            pos1.ch = 0; pos2.ch = Infinity;
            editor.setSelection(pos2, pos1);
            let wholeText = editor.getValue()
            let selection = editor.getSelection();
            let YAMLPos = this.getYAMLPos(wholeText);
            let result = selection.replace(this.HeadingTagRegex, (Pre, CharPos) => {
                let index = editor.posToOffset(pos1) + CharPos
                if (this.IsYAML(index, pos1.line, YAMLPos)
                    || CodeBlockJudge.IsInAnyCodeBlock(wholeText, index)) return Pre;
                return this.NewHeading(Pre);
            })
            editor.replaceRange(result, pos1, pos2);
        }
        else {
            /*更改单行*/
            let rawin = editor.getLine(pos1.line);
            let result = rawin.replace(this.HeadingTagRegex, this.NewHeading)
            editor.setLine(pos1.line, result);
            editor.setCursor({ ch: pos1.ch + result.length - rawin.length, line: pos1.line });
        }
    }
    protected NewHeading(Pre: string): string {
        let len = Pre.length;
        let Old, New, result = "";
        if (!(len - 1)) Old = 0;
        else if (Pre[len - 1] == ' ') Old = len - 1;
        else Old = 0;
        New = (Old + 1) % 7;
        for (let i = 0; i < New; ++i)
            result += '#';
        if (New) result += ' ';
        return result;
    }
    /** 找到所有独行---的位置 */
    getYAMLPos(rawin: string) {
        let YAMLPos: number[] = []
        rawin.replace(/(?<=\n|^)---(?=\n)/g, function (matChars, Cindex) {
            //Testlog("Cindex:"+Cindex);
            YAMLPos.push(Cindex);
            return matChars;
        })
        return YAMLPos
    }
    IsYAML(CharPos: number, Line: number, YAMLPos: number[]): boolean {
        if (Line || YAMLPos[0] == undefined) return false;
        else {//YAML只能存在于文本开头
            if (!YAMLPos[1]) return true
            if (CharPos > YAMLPos[1]) return false;
            return true;
        }
    }
}
