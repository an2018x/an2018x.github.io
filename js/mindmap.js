(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to2, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to2, key) && key !== except)
          __defProp(to2, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to2;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/highlight.js/lib/core.js
  var require_core = __commonJS({
    "node_modules/highlight.js/lib/core.js"(exports, module) {
      function deepFreeze(obj) {
        if (obj instanceof Map) {
          obj.clear = obj.delete = obj.set = function() {
            throw new Error("map is read-only");
          };
        } else if (obj instanceof Set) {
          obj.add = obj.clear = obj.delete = function() {
            throw new Error("set is read-only");
          };
        }
        Object.freeze(obj);
        Object.getOwnPropertyNames(obj).forEach((name) => {
          const prop = obj[name];
          const type = typeof prop;
          if ((type === "object" || type === "function") && !Object.isFrozen(prop)) {
            deepFreeze(prop);
          }
        });
        return obj;
      }
      var Response = class {
        /**
         * @param {CompiledMode} mode
         */
        constructor(mode) {
          if (mode.data === void 0) mode.data = {};
          this.data = mode.data;
          this.isMatchIgnored = false;
        }
        ignoreMatch() {
          this.isMatchIgnored = true;
        }
      };
      function escapeHTML(value) {
        return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
      }
      function inherit$1(original, ...objects) {
        const result = /* @__PURE__ */ Object.create(null);
        for (const key in original) {
          result[key] = original[key];
        }
        objects.forEach(function(obj) {
          for (const key in obj) {
            result[key] = obj[key];
          }
        });
        return (
          /** @type {T} */
          result
        );
      }
      var SPAN_CLOSE = "</span>";
      var emitsWrappingTags = (node) => {
        return !!node.scope;
      };
      var scopeToCSSClass = (name, { prefix }) => {
        if (name.startsWith("language:")) {
          return name.replace("language:", "language-");
        }
        if (name.includes(".")) {
          const pieces = name.split(".");
          return [
            `${prefix}${pieces.shift()}`,
            ...pieces.map((x, i) => `${x}${"_".repeat(i + 1)}`)
          ].join(" ");
        }
        return `${prefix}${name}`;
      };
      var HTMLRenderer = class {
        /**
         * Creates a new HTMLRenderer
         *
         * @param {Tree} parseTree - the parse tree (must support `walk` API)
         * @param {{classPrefix: string}} options
         */
        constructor(parseTree, options) {
          this.buffer = "";
          this.classPrefix = options.classPrefix;
          parseTree.walk(this);
        }
        /**
         * Adds texts to the output stream
         *
         * @param {string} text */
        addText(text) {
          this.buffer += escapeHTML(text);
        }
        /**
         * Adds a node open to the output stream (if needed)
         *
         * @param {Node} node */
        openNode(node) {
          if (!emitsWrappingTags(node)) return;
          const className = scopeToCSSClass(
            node.scope,
            { prefix: this.classPrefix }
          );
          this.span(className);
        }
        /**
         * Adds a node close to the output stream (if needed)
         *
         * @param {Node} node */
        closeNode(node) {
          if (!emitsWrappingTags(node)) return;
          this.buffer += SPAN_CLOSE;
        }
        /**
         * returns the accumulated buffer
        */
        value() {
          return this.buffer;
        }
        // helpers
        /**
         * Builds a span element
         *
         * @param {string} className */
        span(className) {
          this.buffer += `<span class="${className}">`;
        }
      };
      var newNode = (opts = {}) => {
        const result = { children: [] };
        Object.assign(result, opts);
        return result;
      };
      var TokenTree = class _TokenTree {
        constructor() {
          this.rootNode = newNode();
          this.stack = [this.rootNode];
        }
        get top() {
          return this.stack[this.stack.length - 1];
        }
        get root() {
          return this.rootNode;
        }
        /** @param {Node} node */
        add(node) {
          this.top.children.push(node);
        }
        /** @param {string} scope */
        openNode(scope) {
          const node = newNode({ scope });
          this.add(node);
          this.stack.push(node);
        }
        closeNode() {
          if (this.stack.length > 1) {
            return this.stack.pop();
          }
          return void 0;
        }
        closeAllNodes() {
          while (this.closeNode()) ;
        }
        toJSON() {
          return JSON.stringify(this.rootNode, null, 4);
        }
        /**
         * @typedef { import("./html_renderer").Renderer } Renderer
         * @param {Renderer} builder
         */
        walk(builder) {
          return this.constructor._walk(builder, this.rootNode);
        }
        /**
         * @param {Renderer} builder
         * @param {Node} node
         */
        static _walk(builder, node) {
          if (typeof node === "string") {
            builder.addText(node);
          } else if (node.children) {
            builder.openNode(node);
            node.children.forEach((child) => this._walk(builder, child));
            builder.closeNode(node);
          }
          return builder;
        }
        /**
         * @param {Node} node
         */
        static _collapse(node) {
          if (typeof node === "string") return;
          if (!node.children) return;
          if (node.children.every((el) => typeof el === "string")) {
            node.children = [node.children.join("")];
          } else {
            node.children.forEach((child) => {
              _TokenTree._collapse(child);
            });
          }
        }
      };
      var TokenTreeEmitter = class extends TokenTree {
        /**
         * @param {*} options
         */
        constructor(options) {
          super();
          this.options = options;
        }
        /**
         * @param {string} text
         */
        addText(text) {
          if (text === "") {
            return;
          }
          this.add(text);
        }
        /** @param {string} scope */
        startScope(scope) {
          this.openNode(scope);
        }
        endScope() {
          this.closeNode();
        }
        /**
         * @param {Emitter & {root: DataNode}} emitter
         * @param {string} name
         */
        __addSublanguage(emitter, name) {
          const node = emitter.root;
          if (name) node.scope = `language:${name}`;
          this.add(node);
        }
        toHTML() {
          const renderer = new HTMLRenderer(this, this.options);
          return renderer.value();
        }
        finalize() {
          this.closeAllNodes();
          return true;
        }
      };
      function source(re2) {
        if (!re2) return null;
        if (typeof re2 === "string") return re2;
        return re2.source;
      }
      function lookahead(re2) {
        return concat("(?=", re2, ")");
      }
      function anyNumberOfTimes(re2) {
        return concat("(?:", re2, ")*");
      }
      function optional(re2) {
        return concat("(?:", re2, ")?");
      }
      function concat(...args) {
        const joined = args.map((x) => source(x)).join("");
        return joined;
      }
      function stripOptionsFromArgs(args) {
        const opts = args[args.length - 1];
        if (typeof opts === "object" && opts.constructor === Object) {
          args.splice(args.length - 1, 1);
          return opts;
        } else {
          return {};
        }
      }
      function either(...args) {
        const opts = stripOptionsFromArgs(args);
        const joined = "(" + (opts.capture ? "" : "?:") + args.map((x) => source(x)).join("|") + ")";
        return joined;
      }
      function countMatchGroups(re2) {
        return new RegExp(re2.toString() + "|").exec("").length - 1;
      }
      function startsWith(re2, lexeme) {
        const match = re2 && re2.exec(lexeme);
        return match && match.index === 0;
      }
      var BACKREF_RE = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
      function _rewriteBackreferences(regexps, { joinWith }) {
        let numCaptures = 0;
        return regexps.map((regex) => {
          numCaptures += 1;
          const offset = numCaptures;
          let re2 = source(regex);
          let out = "";
          while (re2.length > 0) {
            const match = BACKREF_RE.exec(re2);
            if (!match) {
              out += re2;
              break;
            }
            out += re2.substring(0, match.index);
            re2 = re2.substring(match.index + match[0].length);
            if (match[0][0] === "\\" && match[1]) {
              out += "\\" + String(Number(match[1]) + offset);
            } else {
              out += match[0];
              if (match[0] === "(") {
                numCaptures++;
              }
            }
          }
          return out;
        }).map((re2) => `(${re2})`).join(joinWith);
      }
      var MATCH_NOTHING_RE = /\b\B/;
      var IDENT_RE2 = "[a-zA-Z]\\w*";
      var UNDERSCORE_IDENT_RE = "[a-zA-Z_]\\w*";
      var NUMBER_RE = "\\b\\d+(\\.\\d+)?";
      var C_NUMBER_RE = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)";
      var BINARY_NUMBER_RE = "\\b(0b[01]+)";
      var RE_STARTERS_RE = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~";
      var SHEBANG = (opts = {}) => {
        const beginShebang = /^#![ ]*\//;
        if (opts.binary) {
          opts.begin = concat(
            beginShebang,
            /.*\b/,
            opts.binary,
            /\b.*/
          );
        }
        return inherit$1({
          scope: "meta",
          begin: beginShebang,
          end: /$/,
          relevance: 0,
          /** @type {ModeCallback} */
          "on:begin": (m, resp) => {
            if (m.index !== 0) resp.ignoreMatch();
          }
        }, opts);
      };
      var BACKSLASH_ESCAPE = {
        begin: "\\\\[\\s\\S]",
        relevance: 0
      };
      var APOS_STRING_MODE = {
        scope: "string",
        begin: "'",
        end: "'",
        illegal: "\\n",
        contains: [BACKSLASH_ESCAPE]
      };
      var QUOTE_STRING_MODE = {
        scope: "string",
        begin: '"',
        end: '"',
        illegal: "\\n",
        contains: [BACKSLASH_ESCAPE]
      };
      var PHRASAL_WORDS_MODE = {
        begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
      };
      var COMMENT = function(begin, end, modeOptions = {}) {
        const mode = inherit$1(
          {
            scope: "comment",
            begin,
            end,
            contains: []
          },
          modeOptions
        );
        mode.contains.push({
          scope: "doctag",
          // hack to avoid the space from being included. the space is necessary to
          // match here to prevent the plain text rule below from gobbling up doctags
          begin: "[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
          end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
          excludeBegin: true,
          relevance: 0
        });
        const ENGLISH_WORD = either(
          // list of common 1 and 2 letter words in English
          "I",
          "a",
          "is",
          "so",
          "us",
          "to",
          "at",
          "if",
          "in",
          "it",
          "on",
          // note: this is not an exhaustive list of contractions, just popular ones
          /[A-Za-z]+['](d|ve|re|ll|t|s|n)/,
          // contractions - can't we'd they're let's, etc
          /[A-Za-z]+[-][a-z]+/,
          // `no-way`, etc.
          /[A-Za-z][a-z]{2,}/
          // allow capitalized words at beginning of sentences
        );
        mode.contains.push(
          {
            // TODO: how to include ", (, ) without breaking grammars that use these for
            // comment delimiters?
            // begin: /[ ]+([()"]?([A-Za-z'-]{3,}|is|a|I|so|us|[tT][oO]|at|if|in|it|on)[.]?[()":]?([.][ ]|[ ]|\))){3}/
            // ---
            // this tries to find sequences of 3 english words in a row (without any
            // "programming" type syntax) this gives us a strong signal that we've
            // TRULY found a comment - vs perhaps scanning with the wrong language.
            // It's possible to find something that LOOKS like the start of the
            // comment - but then if there is no readable text - good chance it is a
            // false match and not a comment.
            //
            // for a visual example please see:
            // https://github.com/highlightjs/highlight.js/issues/2827
            begin: concat(
              /[ ]+/,
              // necessary to prevent us gobbling up doctags like /* @author Bob Mcgill */
              "(",
              ENGLISH_WORD,
              /[.]?[:]?([.][ ]|[ ])/,
              "){3}"
            )
            // look for 3 words in a row
          }
        );
        return mode;
      };
      var C_LINE_COMMENT_MODE = COMMENT("//", "$");
      var C_BLOCK_COMMENT_MODE = COMMENT("/\\*", "\\*/");
      var HASH_COMMENT_MODE = COMMENT("#", "$");
      var NUMBER_MODE = {
        scope: "number",
        begin: NUMBER_RE,
        relevance: 0
      };
      var C_NUMBER_MODE = {
        scope: "number",
        begin: C_NUMBER_RE,
        relevance: 0
      };
      var BINARY_NUMBER_MODE = {
        scope: "number",
        begin: BINARY_NUMBER_RE,
        relevance: 0
      };
      var REGEXP_MODE = {
        scope: "regexp",
        begin: /\/(?=[^/\n]*\/)/,
        end: /\/[gimuy]*/,
        contains: [
          BACKSLASH_ESCAPE,
          {
            begin: /\[/,
            end: /\]/,
            relevance: 0,
            contains: [BACKSLASH_ESCAPE]
          }
        ]
      };
      var TITLE_MODE = {
        scope: "title",
        begin: IDENT_RE2,
        relevance: 0
      };
      var UNDERSCORE_TITLE_MODE = {
        scope: "title",
        begin: UNDERSCORE_IDENT_RE,
        relevance: 0
      };
      var METHOD_GUARD = {
        // excludes method names from keyword processing
        begin: "\\.\\s*" + UNDERSCORE_IDENT_RE,
        relevance: 0
      };
      var END_SAME_AS_BEGIN = function(mode) {
        return Object.assign(
          mode,
          {
            /** @type {ModeCallback} */
            "on:begin": (m, resp) => {
              resp.data._beginMatch = m[1];
            },
            /** @type {ModeCallback} */
            "on:end": (m, resp) => {
              if (resp.data._beginMatch !== m[1]) resp.ignoreMatch();
            }
          }
        );
      };
      var MODES = /* @__PURE__ */ Object.freeze({
        __proto__: null,
        APOS_STRING_MODE,
        BACKSLASH_ESCAPE,
        BINARY_NUMBER_MODE,
        BINARY_NUMBER_RE,
        COMMENT,
        C_BLOCK_COMMENT_MODE,
        C_LINE_COMMENT_MODE,
        C_NUMBER_MODE,
        C_NUMBER_RE,
        END_SAME_AS_BEGIN,
        HASH_COMMENT_MODE,
        IDENT_RE: IDENT_RE2,
        MATCH_NOTHING_RE,
        METHOD_GUARD,
        NUMBER_MODE,
        NUMBER_RE,
        PHRASAL_WORDS_MODE,
        QUOTE_STRING_MODE,
        REGEXP_MODE,
        RE_STARTERS_RE,
        SHEBANG,
        TITLE_MODE,
        UNDERSCORE_IDENT_RE,
        UNDERSCORE_TITLE_MODE
      });
      function skipIfHasPrecedingDot(match, response) {
        const before = match.input[match.index - 1];
        if (before === ".") {
          response.ignoreMatch();
        }
      }
      function scopeClassName(mode, _parent) {
        if (mode.className !== void 0) {
          mode.scope = mode.className;
          delete mode.className;
        }
      }
      function beginKeywords(mode, parent) {
        if (!parent) return;
        if (!mode.beginKeywords) return;
        mode.begin = "\\b(" + mode.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)";
        mode.__beforeBegin = skipIfHasPrecedingDot;
        mode.keywords = mode.keywords || mode.beginKeywords;
        delete mode.beginKeywords;
        if (mode.relevance === void 0) mode.relevance = 0;
      }
      function compileIllegal(mode, _parent) {
        if (!Array.isArray(mode.illegal)) return;
        mode.illegal = either(...mode.illegal);
      }
      function compileMatch(mode, _parent) {
        if (!mode.match) return;
        if (mode.begin || mode.end) throw new Error("begin & end are not supported with match");
        mode.begin = mode.match;
        delete mode.match;
      }
      function compileRelevance(mode, _parent) {
        if (mode.relevance === void 0) mode.relevance = 1;
      }
      var beforeMatchExt = (mode, parent) => {
        if (!mode.beforeMatch) return;
        if (mode.starts) throw new Error("beforeMatch cannot be used with starts");
        const originalMode = Object.assign({}, mode);
        Object.keys(mode).forEach((key) => {
          delete mode[key];
        });
        mode.keywords = originalMode.keywords;
        mode.begin = concat(originalMode.beforeMatch, lookahead(originalMode.begin));
        mode.starts = {
          relevance: 0,
          contains: [
            Object.assign(originalMode, { endsParent: true })
          ]
        };
        mode.relevance = 0;
        delete originalMode.beforeMatch;
      };
      var COMMON_KEYWORDS = [
        "of",
        "and",
        "for",
        "in",
        "not",
        "or",
        "if",
        "then",
        "parent",
        // common variable name
        "list",
        // common variable name
        "value"
        // common variable name
      ];
      var DEFAULT_KEYWORD_SCOPE = "keyword";
      function compileKeywords(rawKeywords, caseInsensitive, scopeName = DEFAULT_KEYWORD_SCOPE) {
        const compiledKeywords = /* @__PURE__ */ Object.create(null);
        if (typeof rawKeywords === "string") {
          compileList(scopeName, rawKeywords.split(" "));
        } else if (Array.isArray(rawKeywords)) {
          compileList(scopeName, rawKeywords);
        } else {
          Object.keys(rawKeywords).forEach(function(scopeName2) {
            Object.assign(
              compiledKeywords,
              compileKeywords(rawKeywords[scopeName2], caseInsensitive, scopeName2)
            );
          });
        }
        return compiledKeywords;
        function compileList(scopeName2, keywordList) {
          if (caseInsensitive) {
            keywordList = keywordList.map((x) => x.toLowerCase());
          }
          keywordList.forEach(function(keyword) {
            const pair = keyword.split("|");
            compiledKeywords[pair[0]] = [scopeName2, scoreForKeyword(pair[0], pair[1])];
          });
        }
      }
      function scoreForKeyword(keyword, providedScore) {
        if (providedScore) {
          return Number(providedScore);
        }
        return commonKeyword(keyword) ? 0 : 1;
      }
      function commonKeyword(keyword) {
        return COMMON_KEYWORDS.includes(keyword.toLowerCase());
      }
      var seenDeprecations = {};
      var error = (message) => {
        console.error(message);
      };
      var warn = (message, ...args) => {
        console.log(`WARN: ${message}`, ...args);
      };
      var deprecated = (version2, message) => {
        if (seenDeprecations[`${version2}/${message}`]) return;
        console.log(`Deprecated as of ${version2}. ${message}`);
        seenDeprecations[`${version2}/${message}`] = true;
      };
      var MultiClassError = new Error();
      function remapScopeNames(mode, regexes, { key }) {
        let offset = 0;
        const scopeNames = mode[key];
        const emit = {};
        const positions = {};
        for (let i = 1; i <= regexes.length; i++) {
          positions[i + offset] = scopeNames[i];
          emit[i + offset] = true;
          offset += countMatchGroups(regexes[i - 1]);
        }
        mode[key] = positions;
        mode[key]._emit = emit;
        mode[key]._multi = true;
      }
      function beginMultiClass(mode) {
        if (!Array.isArray(mode.begin)) return;
        if (mode.skip || mode.excludeBegin || mode.returnBegin) {
          error("skip, excludeBegin, returnBegin not compatible with beginScope: {}");
          throw MultiClassError;
        }
        if (typeof mode.beginScope !== "object" || mode.beginScope === null) {
          error("beginScope must be object");
          throw MultiClassError;
        }
        remapScopeNames(mode, mode.begin, { key: "beginScope" });
        mode.begin = _rewriteBackreferences(mode.begin, { joinWith: "" });
      }
      function endMultiClass(mode) {
        if (!Array.isArray(mode.end)) return;
        if (mode.skip || mode.excludeEnd || mode.returnEnd) {
          error("skip, excludeEnd, returnEnd not compatible with endScope: {}");
          throw MultiClassError;
        }
        if (typeof mode.endScope !== "object" || mode.endScope === null) {
          error("endScope must be object");
          throw MultiClassError;
        }
        remapScopeNames(mode, mode.end, { key: "endScope" });
        mode.end = _rewriteBackreferences(mode.end, { joinWith: "" });
      }
      function scopeSugar(mode) {
        if (mode.scope && typeof mode.scope === "object" && mode.scope !== null) {
          mode.beginScope = mode.scope;
          delete mode.scope;
        }
      }
      function MultiClass(mode) {
        scopeSugar(mode);
        if (typeof mode.beginScope === "string") {
          mode.beginScope = { _wrap: mode.beginScope };
        }
        if (typeof mode.endScope === "string") {
          mode.endScope = { _wrap: mode.endScope };
        }
        beginMultiClass(mode);
        endMultiClass(mode);
      }
      function compileLanguage(language) {
        function langRe(value, global) {
          return new RegExp(
            source(value),
            "m" + (language.case_insensitive ? "i" : "") + (language.unicodeRegex ? "u" : "") + (global ? "g" : "")
          );
        }
        class MultiRegex {
          constructor() {
            this.matchIndexes = {};
            this.regexes = [];
            this.matchAt = 1;
            this.position = 0;
          }
          // @ts-ignore
          addRule(re2, opts) {
            opts.position = this.position++;
            this.matchIndexes[this.matchAt] = opts;
            this.regexes.push([opts, re2]);
            this.matchAt += countMatchGroups(re2) + 1;
          }
          compile() {
            if (this.regexes.length === 0) {
              this.exec = () => null;
            }
            const terminators = this.regexes.map((el) => el[1]);
            this.matcherRe = langRe(_rewriteBackreferences(terminators, { joinWith: "|" }), true);
            this.lastIndex = 0;
          }
          /** @param {string} s */
          exec(s) {
            this.matcherRe.lastIndex = this.lastIndex;
            const match = this.matcherRe.exec(s);
            if (!match) {
              return null;
            }
            const i = match.findIndex((el, i2) => i2 > 0 && el !== void 0);
            const matchData = this.matchIndexes[i];
            match.splice(0, i);
            return Object.assign(match, matchData);
          }
        }
        class ResumableMultiRegex {
          constructor() {
            this.rules = [];
            this.multiRegexes = [];
            this.count = 0;
            this.lastIndex = 0;
            this.regexIndex = 0;
          }
          // @ts-ignore
          getMatcher(index) {
            if (this.multiRegexes[index]) return this.multiRegexes[index];
            const matcher = new MultiRegex();
            this.rules.slice(index).forEach(([re2, opts]) => matcher.addRule(re2, opts));
            matcher.compile();
            this.multiRegexes[index] = matcher;
            return matcher;
          }
          resumingScanAtSamePosition() {
            return this.regexIndex !== 0;
          }
          considerAll() {
            this.regexIndex = 0;
          }
          // @ts-ignore
          addRule(re2, opts) {
            this.rules.push([re2, opts]);
            if (opts.type === "begin") this.count++;
          }
          /** @param {string} s */
          exec(s) {
            const m = this.getMatcher(this.regexIndex);
            m.lastIndex = this.lastIndex;
            let result = m.exec(s);
            if (this.resumingScanAtSamePosition()) {
              if (result && result.index === this.lastIndex) ;
              else {
                const m2 = this.getMatcher(0);
                m2.lastIndex = this.lastIndex + 1;
                result = m2.exec(s);
              }
            }
            if (result) {
              this.regexIndex += result.position + 1;
              if (this.regexIndex === this.count) {
                this.considerAll();
              }
            }
            return result;
          }
        }
        function buildModeRegex(mode) {
          const mm = new ResumableMultiRegex();
          mode.contains.forEach((term) => mm.addRule(term.begin, { rule: term, type: "begin" }));
          if (mode.terminatorEnd) {
            mm.addRule(mode.terminatorEnd, { type: "end" });
          }
          if (mode.illegal) {
            mm.addRule(mode.illegal, { type: "illegal" });
          }
          return mm;
        }
        function compileMode(mode, parent) {
          const cmode = (
            /** @type CompiledMode */
            mode
          );
          if (mode.isCompiled) return cmode;
          [
            scopeClassName,
            // do this early so compiler extensions generally don't have to worry about
            // the distinction between match/begin
            compileMatch,
            MultiClass,
            beforeMatchExt
          ].forEach((ext) => ext(mode, parent));
          language.compilerExtensions.forEach((ext) => ext(mode, parent));
          mode.__beforeBegin = null;
          [
            beginKeywords,
            // do this later so compiler extensions that come earlier have access to the
            // raw array if they wanted to perhaps manipulate it, etc.
            compileIllegal,
            // default to 1 relevance if not specified
            compileRelevance
          ].forEach((ext) => ext(mode, parent));
          mode.isCompiled = true;
          let keywordPattern = null;
          if (typeof mode.keywords === "object" && mode.keywords.$pattern) {
            mode.keywords = Object.assign({}, mode.keywords);
            keywordPattern = mode.keywords.$pattern;
            delete mode.keywords.$pattern;
          }
          keywordPattern = keywordPattern || /\w+/;
          if (mode.keywords) {
            mode.keywords = compileKeywords(mode.keywords, language.case_insensitive);
          }
          cmode.keywordPatternRe = langRe(keywordPattern, true);
          if (parent) {
            if (!mode.begin) mode.begin = /\B|\b/;
            cmode.beginRe = langRe(cmode.begin);
            if (!mode.end && !mode.endsWithParent) mode.end = /\B|\b/;
            if (mode.end) cmode.endRe = langRe(cmode.end);
            cmode.terminatorEnd = source(cmode.end) || "";
            if (mode.endsWithParent && parent.terminatorEnd) {
              cmode.terminatorEnd += (mode.end ? "|" : "") + parent.terminatorEnd;
            }
          }
          if (mode.illegal) cmode.illegalRe = langRe(
            /** @type {RegExp | string} */
            mode.illegal
          );
          if (!mode.contains) mode.contains = [];
          mode.contains = [].concat(...mode.contains.map(function(c) {
            return expandOrCloneMode(c === "self" ? mode : c);
          }));
          mode.contains.forEach(function(c) {
            compileMode(
              /** @type Mode */
              c,
              cmode
            );
          });
          if (mode.starts) {
            compileMode(mode.starts, parent);
          }
          cmode.matcher = buildModeRegex(cmode);
          return cmode;
        }
        if (!language.compilerExtensions) language.compilerExtensions = [];
        if (language.contains && language.contains.includes("self")) {
          throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
        }
        language.classNameAliases = inherit$1(language.classNameAliases || {});
        return compileMode(
          /** @type Mode */
          language
        );
      }
      function dependencyOnParent(mode) {
        if (!mode) return false;
        return mode.endsWithParent || dependencyOnParent(mode.starts);
      }
      function expandOrCloneMode(mode) {
        if (mode.variants && !mode.cachedVariants) {
          mode.cachedVariants = mode.variants.map(function(variant) {
            return inherit$1(mode, { variants: null }, variant);
          });
        }
        if (mode.cachedVariants) {
          return mode.cachedVariants;
        }
        if (dependencyOnParent(mode)) {
          return inherit$1(mode, { starts: mode.starts ? inherit$1(mode.starts) : null });
        }
        if (Object.isFrozen(mode)) {
          return inherit$1(mode);
        }
        return mode;
      }
      var version = "11.11.1";
      var HTMLInjectionError = class extends Error {
        constructor(reason, html) {
          super(reason);
          this.name = "HTMLInjectionError";
          this.html = html;
        }
      };
      var escape = escapeHTML;
      var inherit = inherit$1;
      var NO_MATCH = /* @__PURE__ */ Symbol("nomatch");
      var MAX_KEYWORD_HITS = 7;
      var HLJS = function(hljs) {
        const languages = /* @__PURE__ */ Object.create(null);
        const aliases = /* @__PURE__ */ Object.create(null);
        const plugins = [];
        let SAFE_MODE = true;
        const LANGUAGE_NOT_FOUND = "Could not find the language '{}', did you forget to load/include a language module?";
        const PLAINTEXT_LANGUAGE = { disableAutodetect: true, name: "Plain text", contains: [] };
        let options = {
          ignoreUnescapedHTML: false,
          throwUnescapedHTML: false,
          noHighlightRe: /^(no-?highlight)$/i,
          languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
          classPrefix: "hljs-",
          cssSelector: "pre code",
          languages: null,
          // beta configuration options, subject to change, welcome to discuss
          // https://github.com/highlightjs/highlight.js/issues/1086
          __emitter: TokenTreeEmitter
        };
        function shouldNotHighlight(languageName) {
          return options.noHighlightRe.test(languageName);
        }
        function blockLanguage(block) {
          let classes = block.className + " ";
          classes += block.parentNode ? block.parentNode.className : "";
          const match = options.languageDetectRe.exec(classes);
          if (match) {
            const language = getLanguage(match[1]);
            if (!language) {
              warn(LANGUAGE_NOT_FOUND.replace("{}", match[1]));
              warn("Falling back to no-highlight mode for this block.", block);
            }
            return language ? match[1] : "no-highlight";
          }
          return classes.split(/\s+/).find((_class) => shouldNotHighlight(_class) || getLanguage(_class));
        }
        function highlight2(codeOrLanguageName, optionsOrCode, ignoreIllegals) {
          let code = "";
          let languageName = "";
          if (typeof optionsOrCode === "object") {
            code = codeOrLanguageName;
            ignoreIllegals = optionsOrCode.ignoreIllegals;
            languageName = optionsOrCode.language;
          } else {
            deprecated("10.7.0", "highlight(lang, code, ...args) has been deprecated.");
            deprecated("10.7.0", "Please use highlight(code, options) instead.\nhttps://github.com/highlightjs/highlight.js/issues/2277");
            languageName = codeOrLanguageName;
            code = optionsOrCode;
          }
          if (ignoreIllegals === void 0) {
            ignoreIllegals = true;
          }
          const context = {
            code,
            language: languageName
          };
          fire("before:highlight", context);
          const result = context.result ? context.result : _highlight(context.language, context.code, ignoreIllegals);
          result.code = context.code;
          fire("after:highlight", result);
          return result;
        }
        function _highlight(languageName, codeToHighlight, ignoreIllegals, continuation) {
          const keywordHits = /* @__PURE__ */ Object.create(null);
          function keywordData(mode, matchText) {
            return mode.keywords[matchText];
          }
          function processKeywords() {
            if (!top.keywords) {
              emitter.addText(modeBuffer);
              return;
            }
            let lastIndex = 0;
            top.keywordPatternRe.lastIndex = 0;
            let match = top.keywordPatternRe.exec(modeBuffer);
            let buf = "";
            while (match) {
              buf += modeBuffer.substring(lastIndex, match.index);
              const word = language.case_insensitive ? match[0].toLowerCase() : match[0];
              const data = keywordData(top, word);
              if (data) {
                const [kind, keywordRelevance] = data;
                emitter.addText(buf);
                buf = "";
                keywordHits[word] = (keywordHits[word] || 0) + 1;
                if (keywordHits[word] <= MAX_KEYWORD_HITS) relevance += keywordRelevance;
                if (kind.startsWith("_")) {
                  buf += match[0];
                } else {
                  const cssClass = language.classNameAliases[kind] || kind;
                  emitKeyword(match[0], cssClass);
                }
              } else {
                buf += match[0];
              }
              lastIndex = top.keywordPatternRe.lastIndex;
              match = top.keywordPatternRe.exec(modeBuffer);
            }
            buf += modeBuffer.substring(lastIndex);
            emitter.addText(buf);
          }
          function processSubLanguage() {
            if (modeBuffer === "") return;
            let result2 = null;
            if (typeof top.subLanguage === "string") {
              if (!languages[top.subLanguage]) {
                emitter.addText(modeBuffer);
                return;
              }
              result2 = _highlight(top.subLanguage, modeBuffer, true, continuations[top.subLanguage]);
              continuations[top.subLanguage] = /** @type {CompiledMode} */
              result2._top;
            } else {
              result2 = highlightAuto(modeBuffer, top.subLanguage.length ? top.subLanguage : null);
            }
            if (top.relevance > 0) {
              relevance += result2.relevance;
            }
            emitter.__addSublanguage(result2._emitter, result2.language);
          }
          function processBuffer() {
            if (top.subLanguage != null) {
              processSubLanguage();
            } else {
              processKeywords();
            }
            modeBuffer = "";
          }
          function emitKeyword(keyword, scope) {
            if (keyword === "") return;
            emitter.startScope(scope);
            emitter.addText(keyword);
            emitter.endScope();
          }
          function emitMultiClass(scope, match) {
            let i = 1;
            const max = match.length - 1;
            while (i <= max) {
              if (!scope._emit[i]) {
                i++;
                continue;
              }
              const klass = language.classNameAliases[scope[i]] || scope[i];
              const text = match[i];
              if (klass) {
                emitKeyword(text, klass);
              } else {
                modeBuffer = text;
                processKeywords();
                modeBuffer = "";
              }
              i++;
            }
          }
          function startNewMode(mode, match) {
            if (mode.scope && typeof mode.scope === "string") {
              emitter.openNode(language.classNameAliases[mode.scope] || mode.scope);
            }
            if (mode.beginScope) {
              if (mode.beginScope._wrap) {
                emitKeyword(modeBuffer, language.classNameAliases[mode.beginScope._wrap] || mode.beginScope._wrap);
                modeBuffer = "";
              } else if (mode.beginScope._multi) {
                emitMultiClass(mode.beginScope, match);
                modeBuffer = "";
              }
            }
            top = Object.create(mode, { parent: { value: top } });
            return top;
          }
          function endOfMode(mode, match, matchPlusRemainder) {
            let matched = startsWith(mode.endRe, matchPlusRemainder);
            if (matched) {
              if (mode["on:end"]) {
                const resp = new Response(mode);
                mode["on:end"](match, resp);
                if (resp.isMatchIgnored) matched = false;
              }
              if (matched) {
                while (mode.endsParent && mode.parent) {
                  mode = mode.parent;
                }
                return mode;
              }
            }
            if (mode.endsWithParent) {
              return endOfMode(mode.parent, match, matchPlusRemainder);
            }
          }
          function doIgnore(lexeme) {
            if (top.matcher.regexIndex === 0) {
              modeBuffer += lexeme[0];
              return 1;
            } else {
              resumeScanAtSamePosition = true;
              return 0;
            }
          }
          function doBeginMatch(match) {
            const lexeme = match[0];
            const newMode = match.rule;
            const resp = new Response(newMode);
            const beforeCallbacks = [newMode.__beforeBegin, newMode["on:begin"]];
            for (const cb of beforeCallbacks) {
              if (!cb) continue;
              cb(match, resp);
              if (resp.isMatchIgnored) return doIgnore(lexeme);
            }
            if (newMode.skip) {
              modeBuffer += lexeme;
            } else {
              if (newMode.excludeBegin) {
                modeBuffer += lexeme;
              }
              processBuffer();
              if (!newMode.returnBegin && !newMode.excludeBegin) {
                modeBuffer = lexeme;
              }
            }
            startNewMode(newMode, match);
            return newMode.returnBegin ? 0 : lexeme.length;
          }
          function doEndMatch(match) {
            const lexeme = match[0];
            const matchPlusRemainder = codeToHighlight.substring(match.index);
            const endMode = endOfMode(top, match, matchPlusRemainder);
            if (!endMode) {
              return NO_MATCH;
            }
            const origin = top;
            if (top.endScope && top.endScope._wrap) {
              processBuffer();
              emitKeyword(lexeme, top.endScope._wrap);
            } else if (top.endScope && top.endScope._multi) {
              processBuffer();
              emitMultiClass(top.endScope, match);
            } else if (origin.skip) {
              modeBuffer += lexeme;
            } else {
              if (!(origin.returnEnd || origin.excludeEnd)) {
                modeBuffer += lexeme;
              }
              processBuffer();
              if (origin.excludeEnd) {
                modeBuffer = lexeme;
              }
            }
            do {
              if (top.scope) {
                emitter.closeNode();
              }
              if (!top.skip && !top.subLanguage) {
                relevance += top.relevance;
              }
              top = top.parent;
            } while (top !== endMode.parent);
            if (endMode.starts) {
              startNewMode(endMode.starts, match);
            }
            return origin.returnEnd ? 0 : lexeme.length;
          }
          function processContinuations() {
            const list = [];
            for (let current = top; current !== language; current = current.parent) {
              if (current.scope) {
                list.unshift(current.scope);
              }
            }
            list.forEach((item) => emitter.openNode(item));
          }
          let lastMatch = {};
          function processLexeme(textBeforeMatch, match) {
            const lexeme = match && match[0];
            modeBuffer += textBeforeMatch;
            if (lexeme == null) {
              processBuffer();
              return 0;
            }
            if (lastMatch.type === "begin" && match.type === "end" && lastMatch.index === match.index && lexeme === "") {
              modeBuffer += codeToHighlight.slice(match.index, match.index + 1);
              if (!SAFE_MODE) {
                const err = new Error(`0 width match regex (${languageName})`);
                err.languageName = languageName;
                err.badRule = lastMatch.rule;
                throw err;
              }
              return 1;
            }
            lastMatch = match;
            if (match.type === "begin") {
              return doBeginMatch(match);
            } else if (match.type === "illegal" && !ignoreIllegals) {
              const err = new Error('Illegal lexeme "' + lexeme + '" for mode "' + (top.scope || "<unnamed>") + '"');
              err.mode = top;
              throw err;
            } else if (match.type === "end") {
              const processed = doEndMatch(match);
              if (processed !== NO_MATCH) {
                return processed;
              }
            }
            if (match.type === "illegal" && lexeme === "") {
              modeBuffer += "\n";
              return 1;
            }
            if (iterations > 1e5 && iterations > match.index * 3) {
              const err = new Error("potential infinite loop, way more iterations than matches");
              throw err;
            }
            modeBuffer += lexeme;
            return lexeme.length;
          }
          const language = getLanguage(languageName);
          if (!language) {
            error(LANGUAGE_NOT_FOUND.replace("{}", languageName));
            throw new Error('Unknown language: "' + languageName + '"');
          }
          const md = compileLanguage(language);
          let result = "";
          let top = continuation || md;
          const continuations = {};
          const emitter = new options.__emitter(options);
          processContinuations();
          let modeBuffer = "";
          let relevance = 0;
          let index = 0;
          let iterations = 0;
          let resumeScanAtSamePosition = false;
          try {
            if (!language.__emitTokens) {
              top.matcher.considerAll();
              for (; ; ) {
                iterations++;
                if (resumeScanAtSamePosition) {
                  resumeScanAtSamePosition = false;
                } else {
                  top.matcher.considerAll();
                }
                top.matcher.lastIndex = index;
                const match = top.matcher.exec(codeToHighlight);
                if (!match) break;
                const beforeMatch = codeToHighlight.substring(index, match.index);
                const processedCount = processLexeme(beforeMatch, match);
                index = match.index + processedCount;
              }
              processLexeme(codeToHighlight.substring(index));
            } else {
              language.__emitTokens(codeToHighlight, emitter);
            }
            emitter.finalize();
            result = emitter.toHTML();
            return {
              language: languageName,
              value: result,
              relevance,
              illegal: false,
              _emitter: emitter,
              _top: top
            };
          } catch (err) {
            if (err.message && err.message.includes("Illegal")) {
              return {
                language: languageName,
                value: escape(codeToHighlight),
                illegal: true,
                relevance: 0,
                _illegalBy: {
                  message: err.message,
                  index,
                  context: codeToHighlight.slice(index - 100, index + 100),
                  mode: err.mode,
                  resultSoFar: result
                },
                _emitter: emitter
              };
            } else if (SAFE_MODE) {
              return {
                language: languageName,
                value: escape(codeToHighlight),
                illegal: false,
                relevance: 0,
                errorRaised: err,
                _emitter: emitter,
                _top: top
              };
            } else {
              throw err;
            }
          }
        }
        function justTextHighlightResult(code) {
          const result = {
            value: escape(code),
            illegal: false,
            relevance: 0,
            _top: PLAINTEXT_LANGUAGE,
            _emitter: new options.__emitter(options)
          };
          result._emitter.addText(code);
          return result;
        }
        function highlightAuto(code, languageSubset) {
          languageSubset = languageSubset || options.languages || Object.keys(languages);
          const plaintext = justTextHighlightResult(code);
          const results = languageSubset.filter(getLanguage).filter(autoDetection).map(
            (name) => _highlight(name, code, false)
          );
          results.unshift(plaintext);
          const sorted = results.sort((a, b) => {
            if (a.relevance !== b.relevance) return b.relevance - a.relevance;
            if (a.language && b.language) {
              if (getLanguage(a.language).supersetOf === b.language) {
                return 1;
              } else if (getLanguage(b.language).supersetOf === a.language) {
                return -1;
              }
            }
            return 0;
          });
          const [best, secondBest] = sorted;
          const result = best;
          result.secondBest = secondBest;
          return result;
        }
        function updateClassName(element, currentLang, resultLang) {
          const language = currentLang && aliases[currentLang] || resultLang;
          element.classList.add("hljs");
          element.classList.add(`language-${language}`);
        }
        function highlightElement(element) {
          let node = null;
          const language = blockLanguage(element);
          if (shouldNotHighlight(language)) return;
          fire(
            "before:highlightElement",
            { el: element, language }
          );
          if (element.dataset.highlighted) {
            console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", element);
            return;
          }
          if (element.children.length > 0) {
            if (!options.ignoreUnescapedHTML) {
              console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk.");
              console.warn("https://github.com/highlightjs/highlight.js/wiki/security");
              console.warn("The element with unescaped HTML:");
              console.warn(element);
            }
            if (options.throwUnescapedHTML) {
              const err = new HTMLInjectionError(
                "One of your code blocks includes unescaped HTML.",
                element.innerHTML
              );
              throw err;
            }
          }
          node = element;
          const text = node.textContent;
          const result = language ? highlight2(text, { language, ignoreIllegals: true }) : highlightAuto(text);
          element.innerHTML = result.value;
          element.dataset.highlighted = "yes";
          updateClassName(element, language, result.language);
          element.result = {
            language: result.language,
            // TODO: remove with version 11.0
            re: result.relevance,
            relevance: result.relevance
          };
          if (result.secondBest) {
            element.secondBest = {
              language: result.secondBest.language,
              relevance: result.secondBest.relevance
            };
          }
          fire("after:highlightElement", { el: element, result, text });
        }
        function configure(userOptions) {
          options = inherit(options, userOptions);
        }
        const initHighlighting = () => {
          highlightAll();
          deprecated("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
        };
        function initHighlightingOnLoad() {
          highlightAll();
          deprecated("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
        }
        let wantsHighlight = false;
        function highlightAll() {
          function boot() {
            highlightAll();
          }
          if (document.readyState === "loading") {
            if (!wantsHighlight) {
              window.addEventListener("DOMContentLoaded", boot, false);
            }
            wantsHighlight = true;
            return;
          }
          const blocks = document.querySelectorAll(options.cssSelector);
          blocks.forEach(highlightElement);
        }
        function registerLanguage(languageName, languageDefinition) {
          let lang = null;
          try {
            lang = languageDefinition(hljs);
          } catch (error$1) {
            error("Language definition for '{}' could not be registered.".replace("{}", languageName));
            if (!SAFE_MODE) {
              throw error$1;
            } else {
              error(error$1);
            }
            lang = PLAINTEXT_LANGUAGE;
          }
          if (!lang.name) lang.name = languageName;
          languages[languageName] = lang;
          lang.rawDefinition = languageDefinition.bind(null, hljs);
          if (lang.aliases) {
            registerAliases(lang.aliases, { languageName });
          }
        }
        function unregisterLanguage(languageName) {
          delete languages[languageName];
          for (const alias of Object.keys(aliases)) {
            if (aliases[alias] === languageName) {
              delete aliases[alias];
            }
          }
        }
        function listLanguages() {
          return Object.keys(languages);
        }
        function getLanguage(name) {
          name = (name || "").toLowerCase();
          return languages[name] || languages[aliases[name]];
        }
        function registerAliases(aliasList, { languageName }) {
          if (typeof aliasList === "string") {
            aliasList = [aliasList];
          }
          aliasList.forEach((alias) => {
            aliases[alias.toLowerCase()] = languageName;
          });
        }
        function autoDetection(name) {
          const lang = getLanguage(name);
          return lang && !lang.disableAutodetect;
        }
        function upgradePluginAPI(plugin) {
          if (plugin["before:highlightBlock"] && !plugin["before:highlightElement"]) {
            plugin["before:highlightElement"] = (data) => {
              plugin["before:highlightBlock"](
                Object.assign({ block: data.el }, data)
              );
            };
          }
          if (plugin["after:highlightBlock"] && !plugin["after:highlightElement"]) {
            plugin["after:highlightElement"] = (data) => {
              plugin["after:highlightBlock"](
                Object.assign({ block: data.el }, data)
              );
            };
          }
        }
        function addPlugin(plugin) {
          upgradePluginAPI(plugin);
          plugins.push(plugin);
        }
        function removePlugin(plugin) {
          const index = plugins.indexOf(plugin);
          if (index !== -1) {
            plugins.splice(index, 1);
          }
        }
        function fire(event, args) {
          const cb = event;
          plugins.forEach(function(plugin) {
            if (plugin[cb]) {
              plugin[cb](args);
            }
          });
        }
        function deprecateHighlightBlock(el) {
          deprecated("10.7.0", "highlightBlock will be removed entirely in v12.0");
          deprecated("10.7.0", "Please use highlightElement now.");
          return highlightElement(el);
        }
        Object.assign(hljs, {
          highlight: highlight2,
          highlightAuto,
          highlightAll,
          highlightElement,
          // TODO: Remove with v12 API
          highlightBlock: deprecateHighlightBlock,
          configure,
          initHighlighting,
          initHighlightingOnLoad,
          registerLanguage,
          unregisterLanguage,
          listLanguages,
          getLanguage,
          registerAliases,
          autoDetection,
          inherit,
          addPlugin,
          removePlugin
        });
        hljs.debugMode = function() {
          SAFE_MODE = false;
        };
        hljs.safeMode = function() {
          SAFE_MODE = true;
        };
        hljs.versionString = version;
        hljs.regex = {
          concat,
          lookahead,
          either,
          optional,
          anyNumberOfTimes
        };
        for (const key in MODES) {
          if (typeof MODES[key] === "object") {
            deepFreeze(MODES[key]);
          }
        }
        Object.assign(hljs, MODES);
        return hljs;
      };
      var highlight = HLJS({});
      highlight.newInstance = () => HLJS({});
      module.exports = highlight;
      highlight.HighlightJS = highlight;
      highlight.default = highlight;
    }
  });

  // node_modules/mind-elixir/dist/MindElixir.js
  var ve = {
    name: "Latte",
    type: "light",
    palette: ["#dd7878", "#ea76cb", "#8839ef", "#e64553", "#fe640b", "#df8e1d", "#40a02b", "#209fb5", "#1e66f5", "#7287fd"],
    cssVar: {
      "--node-gap-x": "30px",
      "--node-gap-y": "10px",
      "--main-gap-x": "65px",
      "--main-gap-y": "45px",
      "--root-radius": "30px",
      "--main-radius": "20px",
      "--root-color": "#ffffff",
      "--root-bgcolor": "#4c4f69",
      "--root-border-color": "rgba(0, 0, 0, 0)",
      "--main-color": "#444446",
      "--main-bgcolor": "#ffffff",
      "--main-bgcolor-transparent": "rgba(255, 255, 255, 0.8)",
      "--topic-padding": "3px",
      "--color": "#777777",
      "--bgcolor": "#f6f6f6",
      "--selected": "#4dc4ff",
      "--accent-color": "#e64553",
      "--panel-color": "#444446",
      "--panel-bgcolor": "#ffffff",
      "--panel-border-color": "#eaeaea",
      "--map-padding": "50px 80px"
    }
  };
  var we = {
    name: "Dark",
    type: "dark",
    palette: ["#848FA0", "#748BE9", "#D2F9FE", "#4145A5", "#789AFA", "#706CF4", "#EF987F", "#775DD5", "#FCEECF", "#DA7FBC"],
    cssVar: {
      "--node-gap-x": "30px",
      "--node-gap-y": "10px",
      "--main-gap-x": "65px",
      "--main-gap-y": "45px",
      "--root-radius": "30px",
      "--main-radius": "20px",
      "--root-color": "#ffffff",
      "--root-bgcolor": "#2d3748",
      "--root-border-color": "rgba(255, 255, 255, 0.1)",
      "--main-color": "#ffffff",
      "--main-bgcolor": "#4c4f69",
      "--main-bgcolor-transparent": "rgba(76, 79, 105, 0.8)",
      "--topic-padding": "3px",
      "--color": "#cccccc",
      "--bgcolor": "#252526",
      "--selected": "#4dc4ff",
      "--accent-color": "#789AFA",
      "--panel-color": "#ffffff",
      "--panel-bgcolor": "#2d3748",
      "--panel-border-color": "#696969",
      "--map-padding": "50px 80px"
    }
  };
  function me(e) {
    return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }
  var le = function(e, t) {
    if (t.id === e)
      return t;
    if (t.children && t.children.length) {
      for (let n = 0; n < t.children.length; n++) {
        const o = le(e, t.children[n]);
        if (o) return o;
      }
      return null;
    } else
      return null;
  };
  var V = (e, t) => {
    if (e.parent = t, e.children)
      for (let n = 0; n < e.children.length; n++)
        V(e.children[n], e);
  };
  var U = (e, t, n) => {
    if (e.expanded = t, e.children)
      if (n === void 0 || n > 0) {
        const o = n !== void 0 ? n - 1 : void 0;
        e.children.forEach((s) => {
          U(s, t, o);
        });
      } else
        e.children.forEach((o) => {
          U(o, false);
        });
  };
  function xe(e) {
    if (e.id = z(), e.children)
      for (let t = 0; t < e.children.length; t++)
        xe(e.children[t]);
  }
  function ce(e, t, n, o) {
    const s = n - e, i = o - t, c = Math.atan2(i, s) * 180 / Math.PI, r = 12, a = 30, d = (c + 180 - a) * Math.PI / 180, h = (c + 180 + a) * Math.PI / 180;
    return {
      x1: n + Math.cos(d) * r,
      y1: o + Math.sin(d) * r,
      x2: n + Math.cos(h) * r,
      y2: o + Math.sin(h) * r
    };
  }
  function z() {
    return ((/* @__PURE__ */ new Date()).getTime().toString(16) + Math.random().toString(16).substring(2)).substring(2, 18);
  }
  var ut = function() {
    const e = z();
    return {
      topic: this.newTopicName,
      id: e
    };
  };
  function Ee(e) {
    return JSON.parse(
      JSON.stringify(e, (n, o) => {
        if (n !== "parent")
          return o;
      })
    );
  }
  var H = (e, t) => {
    let n = 0, o = 0;
    for (; t && t !== e; )
      n += t.offsetLeft, o += t.offsetTop, t = t.offsetParent;
    return { offsetLeft: n, offsetTop: o };
  };
  var D = (e, t) => {
    for (const n in t)
      e.setAttribute(n, t[n]);
  };
  var re = (e) => e ? e.tagName === "ME-TPC" : false;
  var Ce = (e) => e.filter((t) => t.nodeObj.parent).filter((t, n, o) => {
    for (let s = 0; s < o.length; s++) {
      if (t === o[s]) continue;
      const { parent: i } = t.nodeObj;
      if (i === o[s].nodeObj)
        return false;
    }
    return true;
  });
  var Se = (e) => {
    const t = /translate3d\(([^,]+),\s*([^,]+)/, n = e.match(t);
    return n ? { x: parseFloat(n[1]), y: parseFloat(n[2]) } : { x: 0, y: 0 };
  };
  var Je = function(e) {
    for (let t = 0; t < e.length; t++) {
      const { dom: n, evt: o, func: s } = e[t];
      n.addEventListener(o, s);
    }
    return function() {
      for (let n = 0; n < e.length; n++) {
        const { dom: o, evt: s, func: i } = e[n];
        o.removeEventListener(s, i);
      }
    };
  };
  var Pe = (e, t) => {
    const n = e.x - t.x, o = e.y - t.y;
    return Math.sqrt(n * n + o * o);
  };
  var B = {
    LHS: "lhs",
    RHS: "rhs"
  };
  var pt = function() {
    this.nodes.innerHTML = "";
    const e = this.createTopic(this.nodeData);
    Ne.call(this, e, this.nodeData), e.draggable = false;
    const t = document.createElement("me-root");
    t.appendChild(e);
    const n = this.nodeData.children || [];
    if (this.direction === 2) {
      let o = 0, s = 0;
      n.map((i) => {
        i.direction === 0 ? o += 1 : i.direction === 1 ? s += 1 : o <= s ? (i.direction = 0, o += 1) : (i.direction = 1, s += 1);
      });
    }
    gt(this, n, t);
  };
  var gt = function(e, t, n) {
    const o = document.createElement("me-main");
    o.className = B.LHS;
    const s = document.createElement("me-main");
    s.className = B.RHS;
    for (let i = 0; i < t.length; i++) {
      const l = t[i], { grp: c } = e.createWrapper(l);
      e.direction === 2 ? l.direction === 0 ? o.appendChild(c) : s.appendChild(c) : e.direction === 0 ? o.appendChild(c) : s.appendChild(c);
    }
    e.nodes.appendChild(o), e.nodes.appendChild(n), e.nodes.appendChild(s), e.nodes.appendChild(e.lines), e.nodes.appendChild(e.labelContainer);
  };
  var mt = function(e, t) {
    const n = document.createElement("me-children");
    for (let o = 0; o < t.length; o++) {
      const s = t[o], { grp: i } = e.createWrapper(s);
      n.appendChild(i);
    }
    return n;
  };
  var Ze = function(e, t) {
    const o = (this?.el ? this.el : t || document).querySelector(`[data-nodeid="me${e}"]`);
    if (!o) throw new Error(`FindEle: Node ${e} not found, maybe it's collapsed.`);
    return o;
  };
  var Ne = function(e, t) {
    if (e.innerHTML = "", t.style) {
      const n = t.style;
      for (const o in n)
        e.style[o] = n[o];
    }
    if (t.dangerouslySetInnerHTML) {
      e.innerHTML = t.dangerouslySetInnerHTML;
      return;
    }
    if (t.image) {
      const n = t.image;
      if (n.url && n.width && n.height) {
        const o = document.createElement("img");
        o.src = this.imageProxy ? this.imageProxy(n.url) : n.url, o.style.width = n.width + "px", o.style.height = n.height + "px", n.fit && (o.style.objectFit = n.fit), e.appendChild(o), e.image = o;
      }
    } else e.image && (e.image = void 0);
    {
      const n = document.createElement("span");
      n.className = "text", this.markdown ? n.innerHTML = this.markdown(t.topic, t) : n.textContent = t.topic, e.appendChild(n), e.text = n;
    }
    if (t.hyperLink) {
      const n = document.createElement("a");
      n.className = "hyper-link", n.target = "_blank", n.innerText = "\u{1F517}", n.href = t.hyperLink, e.appendChild(n), e.link = n;
    } else e.link && (e.link = void 0);
    if (t.icons && t.icons.length) {
      const n = document.createElement("span");
      n.className = "icons", n.innerHTML = t.icons.map((o) => `<span>${me(o)}</span>`).join(""), e.appendChild(n), e.icons = n;
    } else e.icons && (e.icons = void 0);
    if (t.tags && t.tags.length) {
      const n = document.createElement("div");
      n.className = "tags", t.tags.forEach((o) => {
        const s = document.createElement("span");
        typeof o == "string" ? s.textContent = o : (s.textContent = o.text, o.className && (s.className = o.className), o.style && Object.assign(s.style, o.style)), n.appendChild(s);
      }), e.appendChild(n), e.tags = n;
    } else e.tags && (e.tags = void 0);
  };
  var yt = function(e, t) {
    const n = document.createElement("me-wrapper"), { p: o, tpc: s } = this.createParent(e);
    if (n.appendChild(o), !t && e.children && e.children.length > 0) {
      const i = Te(e.expanded);
      if (o.appendChild(i), e.expanded !== false) {
        const l = mt(this, e.children);
        n.appendChild(l);
      }
    }
    return { grp: n, top: o, tpc: s };
  };
  var bt = function(e) {
    const t = document.createElement("me-parent"), n = this.createTopic(e);
    return Ne.call(this, n, e), t.appendChild(n), { p: t, tpc: n };
  };
  var vt = function(e) {
    const t = document.createElement("me-children");
    return t.append(...e), t;
  };
  var wt = function(e) {
    const t = document.createElement("me-tpc");
    return t.nodeObj = e, t.dataset.nodeid = "me" + e.id, t;
  };
  function Qe(e) {
    const t = document.createRange();
    t.selectNodeContents(e);
    const n = window.getSelection();
    n && (n.removeAllRanges(), n.addRange(t));
  }
  var xt = function(e) {
    if (!e) return;
    const t = document.createElement("div"), n = e.nodeObj, o = n.topic, { offsetLeft: s, offsetTop: i } = H(this.nodes, e);
    this.nodes.appendChild(t), t.id = "input-box", t.textContent = o, t.contentEditable = "plaintext-only", t.spellcheck = false;
    const l = getComputedStyle(e);
    t.style.cssText = `
  left: ${s}px;
  top: ${i}px;
  min-width:${e.offsetWidth - 8}px;
  color:${l.color};
  font-size:${l.fontSize};
  padding:${l.padding};
  margin:${l.margin}; 
  background-color:${l.backgroundColor !== "rgba(0, 0, 0, 0)" && l.backgroundColor};
  border: ${l.border};
  border-radius:${l.borderRadius}; `, this.direction === 0 && (t.style.right = "0"), Qe(t), this.bus.fire("operation", {
      name: "beginEdit",
      obj: e.nodeObj
    }), t.addEventListener("keydown", (c) => {
      c.stopPropagation();
      const r = c.key;
      if (r === "Enter" || r === "Tab") {
        if (c.shiftKey) return;
        c.preventDefault(), t.blur(), this.container.focus();
      } else r === "Escape" && (c.preventDefault(), t.textContent = o, t.blur(), this.container.focus());
    }), t.addEventListener("blur", () => {
      if (!t) return;
      t.remove();
      const c = t.innerText?.trim() || "";
      c === o || c === "" || (n.topic = c, this.markdown ? e.text.innerHTML = this.markdown(n.topic, n) : e.text.textContent = c, this.linkDiv(), this.bus.fire("operation", {
        name: "finishEdit",
        obj: n,
        origin: o
      }));
    });
  };
  var Te = function(e) {
    const t = document.createElement("me-epd");
    return t.expanded = e !== false, t.className = e !== false ? "minus" : "", t;
  };
  var J = (e) => {
    const t = e.parent?.children, n = t?.indexOf(e) ?? 0;
    return { siblings: t, index: n };
  };
  function Et(e) {
    const { siblings: t, index: n } = J(e);
    if (t === void 0) return;
    const o = t[n];
    n === 0 ? (t[n] = t[t.length - 1], t[t.length - 1] = o) : (t[n] = t[n - 1], t[n - 1] = o);
  }
  function Ct(e) {
    const { siblings: t, index: n } = J(e);
    if (t === void 0) return;
    const o = t[n];
    n === t.length - 1 ? (t[n] = t[0], t[0] = o) : (t[n] = t[n + 1], t[n + 1] = o);
  }
  function et(e) {
    const { siblings: t, index: n } = J(e);
    return t === void 0 ? 0 : (t.splice(n, 1), t.length);
  }
  function St(e, t, n) {
    const { siblings: o, index: s } = J(n);
    o !== void 0 && (t === "before" ? o.splice(s, 0, e) : o.splice(s + 1, 0, e));
  }
  function Nt(e, t) {
    const { siblings: n, index: o } = J(e);
    n !== void 0 && (n[o] = t, t.children = [e]);
  }
  function Tt(e, t, n) {
    if (et(t), n.parent?.parent || (t.direction = n.direction), e === "in")
      n.children ? n.children.push(t) : n.children = [t];
    else {
      t.direction !== void 0 && (t.direction = n.direction);
      const { siblings: o, index: s } = J(n);
      if (o === void 0) return;
      e === "before" ? o.splice(s, 0, t) : o.splice(s + 1, 0, t);
    }
  }
  var _t = function({ map: e, direction: t }, n) {
    if (t === 0)
      return 0;
    if (t === 1)
      return 1;
    if (t === 2) {
      const o = e.querySelector(".lhs")?.childElementCount || 0, s = e.querySelector(".rhs")?.childElementCount || 0;
      return o <= s ? (n.direction = 0, 0) : (n.direction = 1, 1);
    }
  };
  var tt = function(e, t, n) {
    const o = n.children[0].children[0], s = t.parentElement;
    if (s.tagName === "ME-PARENT") {
      if (ee(o), s.children[1])
        s.nextSibling.appendChild(n);
      else {
        const i = e.createChildren([n]);
        s.appendChild(Te(true)), s.insertAdjacentElement("afterend", i);
      }
      e.linkDiv(n.offsetParent);
    } else s.tagName === "ME-ROOT" && (_t(e, o.nodeObj) === 0 ? e.container.querySelector(".lhs")?.appendChild(n) : e.container.querySelector(".rhs")?.appendChild(n), e.linkDiv());
  };
  var kt = function(e, t) {
    const n = e.parentNode;
    if (t === 0) {
      const o = n.parentNode.parentNode;
      o.tagName !== "ME-MAIN" && (o.previousSibling.children[1].remove(), o.remove());
    }
    n.parentNode.remove();
  };
  var nt = {
    before: "beforebegin",
    after: "afterend"
  };
  var ee = function(e) {
    const n = e.parentElement.parentElement.lastElementChild;
    n?.tagName === "svg" && n?.remove();
  };
  var Lt = function(e, t) {
    const n = e.nodeObj, o = Ee(n);
    o.style && t.style && (t.style = Object.assign(o.style, t.style));
    const s = Object.assign(n, t);
    Ne.call(this, e, s), this.linkDiv(), this.bus.fire("operation", {
      name: "reshapeNode",
      obj: s,
      origin: o
    });
  };
  var _e = function(e, t, n) {
    if (!t) return null;
    const o = t.nodeObj;
    o.expanded === false && (e.expandNode(t, true), t = e.findEle(o.id));
    const s = n || e.generateNewObj();
    o.children ? o.children.push(s) : o.children = [s], V(e.nodeData);
    const { grp: i, top: l } = e.createWrapper(s);
    return tt(e, t, i), { newTop: l, newNodeObj: s };
  };
  var Dt = function(e, t, n) {
    const o = t || this.currentNode;
    if (!o) return;
    const s = o.nodeObj;
    if (s.parent) {
      if (!s.parent?.parent && this.direction === 2) {
        const a = this.map.querySelector(".lhs")?.childElementCount || 0, d = this.map.querySelector(".rhs")?.childElementCount || 0;
        if (!a || !d) {
          this.addChild(this.findEle(s.parent.id), n);
          return;
        }
      }
    } else {
      this.addChild();
      return;
    }
    const i = n || this.generateNewObj();
    if (!s.parent?.parent) {
      const a = o.closest("me-main").className === B.LHS ? 0 : 1;
      i.direction = a;
    }
    St(i, e, s), V(this.nodeData);
    const l = o.parentElement, { grp: c, top: r } = this.createWrapper(i);
    l.parentElement.insertAdjacentElement(nt[e], c), this.linkDiv(c.offsetParent), n || this.editTopic(r.firstChild), this.bus.fire("operation", {
      name: "insertSibling",
      type: e,
      obj: i
    }), this.selectNode(r.firstChild, true);
  };
  var At = function(e, t) {
    const n = e || this.currentNode;
    if (!n) return;
    ee(n);
    const o = n.nodeObj;
    if (!o.parent)
      return;
    const s = t || this.generateNewObj();
    Nt(o, s), V(this.nodeData);
    const i = n.parentElement.parentElement, { grp: l, top: c } = this.createWrapper(s, true);
    c.appendChild(Te(true)), i.insertAdjacentElement("afterend", l);
    const r = this.createChildren([i]);
    c.insertAdjacentElement("afterend", r), this.linkDiv(), t || this.editTopic(c.firstChild), this.selectNode(c.firstChild, true), this.bus.fire("operation", {
      name: "insertParent",
      obj: s
    });
  };
  var Mt = function(e, t) {
    const n = e || this.currentNode;
    if (!n) return;
    const o = _e(this, n, t);
    if (!o) return;
    const { newTop: s, newNodeObj: i } = o;
    this.bus.fire("operation", {
      name: "addChild",
      obj: i
    }), t || this.editTopic(s.firstChild), this.selectNode(s.firstChild, true);
  };
  var Pt = function(e, t) {
    const n = Ee(e.nodeObj);
    xe(n);
    const o = _e(this, t, n);
    if (!o) return;
    const { newNodeObj: s } = o;
    this.selectNode(this.findEle(s.id)), this.bus.fire("operation", {
      name: "copyNode",
      obj: s
    });
  };
  var Ot = function(e, t) {
    const n = [];
    for (let o = 0; o < e.length; o++) {
      const s = e[o], i = Ee(s.nodeObj);
      xe(i);
      const l = _e(this, t, i);
      if (!l) return;
      const { newNodeObj: c } = l;
      n.push(c);
    }
    this.unselectNodes(this.currentNodes), this.selectNodes(n.map((o) => this.findEle(o.id))), this.bus.fire("operation", {
      name: "copyNodes",
      objs: n
    });
  };
  var $t = function(e) {
    const t = e || this.currentNode;
    if (!t) return;
    const n = t.nodeObj;
    Et(n);
    const o = t.parentNode.parentNode;
    o.parentNode.insertBefore(o, o.previousSibling), this.linkDiv(), this.bus.fire("operation", {
      name: "moveUpNode",
      obj: n
    });
  };
  var Ht = function(e) {
    const t = e || this.currentNode;
    if (!t) return;
    const n = t.nodeObj;
    Ct(n);
    const o = t.parentNode.parentNode;
    o.nextSibling ? o.nextSibling.insertAdjacentElement("afterend", o) : o.parentNode.prepend(o), this.linkDiv(), this.bus.fire("operation", {
      name: "moveDownNode",
      obj: n
    });
  };
  var jt = function(e) {
    if (e = Ce(e), e.length === 0) return;
    for (const n of e) {
      const o = n.nodeObj, s = et(o);
      kt(n, s);
    }
    const t = e[e.length - 1];
    this.selectNode(this.findEle(t.nodeObj.parent.id)), this.linkDiv(), this.bus.fire("operation", {
      name: "removeNodes",
      objs: e.map((n) => n.nodeObj)
    });
  };
  var ke = (e, t, n, o) => {
    e = Ce(e);
    let s = n.nodeObj;
    t === "in" && s.expanded === false && (o.expandNode(n, true), n = o.findEle(s.id), s = n.nodeObj), t === "after" && (e = e.reverse());
    const i = [];
    for (const c of e) {
      const r = c.nodeObj;
      if (Tt(t, r, s), V(o.nodeData), t === "in") {
        const a = c.parentElement;
        tt(o, n, a.parentElement);
      } else {
        ee(c);
        const a = c.parentElement.parentNode;
        i.includes(a.parentElement) || i.push(a.parentElement), n.parentElement.parentNode.insertAdjacentElement(nt[t], a);
      }
    }
    for (const c of i)
      c.childElementCount === 0 && c.tagName !== "ME-MAIN" && (c.previousSibling.children[1].remove(), c.remove());
    o.linkDiv(), o.scrollIntoView(e[e.length - 1]);
    const l = t === "before" ? "moveNodeBefore" : t === "after" ? "moveNodeAfter" : "moveNodeIn";
    o.bus.fire("operation", {
      name: l,
      objs: e.map((c) => c.nodeObj),
      toObj: s
    });
  };
  var It = function(e, t) {
    ke(e, "in", t, this);
  };
  var Rt = function(e, t) {
    ke(e, "before", t, this);
  };
  var Bt = function(e, t) {
    ke(e, "after", t, this);
  };
  var Yt = function(e) {
    const t = e || this.currentNode;
    t && (t.nodeObj.dangerouslySetInnerHTML || this.editTopic(t));
  };
  var Wt = function(e, t) {
    e.text.textContent = t, e.nodeObj.topic = t, this.linkDiv();
  };
  var ot = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    addChild: Mt,
    beginEdit: Yt,
    copyNode: Pt,
    copyNodes: Ot,
    insertParent: At,
    insertSibling: Dt,
    moveDownNode: Ht,
    moveNodeAfter: Bt,
    moveNodeBefore: Rt,
    moveNodeIn: It,
    moveUpNode: $t,
    removeNodes: jt,
    reshapeNode: Lt,
    rmSubline: ee,
    setNodeTopic: Wt
  }, Symbol.toStringTag, { value: "Module" }));
  function Xt(e) {
    return {
      nodeData: e.isFocusMode ? e.nodeDataBackup : e.nodeData,
      arrows: e.arrows,
      summaries: e.summaries,
      direction: e.direction,
      theme: e.theme
    };
  }
  var Ft = function(e) {
    const t = this.container, n = e.getBoundingClientRect(), o = t.getBoundingClientRect();
    if (n.top > o.bottom - 50 || n.bottom < o.top + 50 || n.left > o.right - 50 || n.right < o.left + 50) {
      const i = n.left + n.width / 2, l = n.top + n.height / 2, c = o.left + o.width / 2, r = o.top + o.height / 2, a = i - c, d = l - r;
      this.move(-a, -d, true);
    }
  };
  var Gt = function(e, t, n) {
    this.clearSelection(), this.scrollIntoView(e), this.selection?.select(e), t && this.bus.fire("selectNewNode", e.nodeObj);
  };
  var Vt = function(e) {
    this.selection?.select(e);
  };
  var zt = function(e) {
    this.selection?.deselect(e);
  };
  var Kt = function() {
    this.unselectNodes(this.currentNodes), this.unselectSummary(), this.unselectArrow();
  };
  var Le = function(e) {
    return JSON.stringify(e, (t, n) => {
      if (!(t === "parent" && typeof n != "string"))
        return n;
    });
  };
  var qt = function() {
    const e = Xt(this);
    return Le(e);
  };
  var Ut = function() {
    return JSON.parse(this.getDataString());
  };
  var Jt = function() {
    this.editable = true;
  };
  var Zt = function() {
    this.editable = false;
  };
  var Qt = function(e, t = { x: 0, y: 0 }) {
    if (e < this.scaleMin && e < this.scaleVal || e > this.scaleMax && e > this.scaleVal) return;
    const n = this.container.getBoundingClientRect(), o = t.x ? t.x - n.left - n.width / 2 : 0, s = t.y ? t.y - n.top - n.height / 2 : 0, { dx: i, dy: l } = De(this), c = this.map.style.transform, { x: r, y: a } = Se(c), d = r - i, h = a - l, u = this.scaleVal, y = (-o + d) * (1 - e / u), b = (-s + h) * (1 - e / u);
    this.map.style.transform = `translate3d(${r - y}px, ${a - b}px, 0) scale(${e})`, this.scaleVal = e, this.bus.fire("scale", e);
  };
  var en = function() {
    const e = this.nodes.offsetHeight / this.container.offsetHeight, t = this.nodes.offsetWidth / this.container.offsetWidth, n = 1 / Math.max(1, Math.max(e, t));
    this.scaleVal = n;
    const { dx: o, dy: s } = De(this, true);
    this.map.style.transform = `translate3d(${o}px, ${s}px, 0) scale(${n})`, this.bus.fire("scale", n);
  };
  var tn = function(e, t, n = false) {
    const { map: o, scaleVal: s, bus: i, container: l, nodes: c } = this;
    if (n && o.style.transition === "transform 0.3s")
      return;
    const r = o.style.transform;
    let { x: a, y: d } = Se(r);
    const h = l.getBoundingClientRect(), u = c.getBoundingClientRect(), y = u.left < h.right && u.right > h.left, b = u.top < h.bottom && u.bottom > h.top;
    if (y) {
      const p = u.left + e, g = u.right + e;
      (p >= h.right || g <= h.left) && (e = 0);
    }
    if (b) {
      const p = u.top + t, g = u.bottom + t;
      (p >= h.bottom || g <= h.top) && (t = 0);
    }
    a += e, d += t, n && (o.style.transition = "transform 0.3s", setTimeout(() => {
      o.style.transition = "none";
    }, 300)), o.style.transform = `translate3d(${a}px, ${d}px, 0) scale(${s})`, i.fire("move", { dx: e, dy: t });
  };
  var De = (e, t = false) => {
    const { container: n, map: o, nodes: s } = e;
    let i, l;
    if (e.alignment === "nodes" || t)
      i = (n.offsetWidth - s.offsetWidth) / 2, l = (n.offsetHeight - s.offsetHeight) / 2, o.style.transformOrigin = "50% 50%";
    else {
      const c = o.querySelector("me-root"), r = c.offsetTop, a = c.offsetLeft, d = c.offsetWidth, h = c.offsetHeight;
      i = n.offsetWidth / 2 - a - d / 2, l = n.offsetHeight / 2 - r - h / 2, o.style.transformOrigin = `${a + d / 2}px 50%`;
    }
    return { dx: i, dy: l };
  };
  var nn = function() {
    const { map: e, container: t } = this, { dx: n, dy: o } = De(this);
    t.scrollTop = 0, t.scrollLeft = 0, e.style.transform = `translate3d(${n}px, ${o}px, 0) scale(${this.scaleVal})`;
  };
  var on = function(e) {
    e(this);
  };
  var sn = function(e) {
    e.nodeObj.parent && (this.clearSelection(), this.tempDirection === null && (this.tempDirection = this.direction), this.isFocusMode || (this.nodeDataBackup = this.nodeData, this.isFocusMode = true), this.nodeData = e.nodeObj, this.initRight(), this.toCenter());
  };
  var rn = function() {
    this.isFocusMode = false, this.tempDirection !== null && (this.nodeData = this.nodeDataBackup, this.direction = this.tempDirection, this.tempDirection = null, this.refresh(), this.toCenter());
  };
  var ln = function() {
    this.direction = 0, this.refresh(), this.toCenter(), this.bus.fire("changeDirection", this.direction);
  };
  var cn = function() {
    this.direction = 1, this.refresh(), this.toCenter(), this.bus.fire("changeDirection", this.direction);
  };
  var an = function() {
    this.direction = 2, this.refresh(), this.toCenter(), this.bus.fire("changeDirection", this.direction);
  };
  var dn = function(e, t) {
    const n = e.nodeObj;
    typeof t == "boolean" ? n.expanded = t : n.expanded !== false ? n.expanded = false : n.expanded = true;
    const o = e.getBoundingClientRect(), s = {
      x: o.left,
      y: o.top
    }, i = e.parentNode, l = i.children[1];
    if (l.expanded = n.expanded, l.className = n.expanded ? "minus" : "", ee(e), n.expanded) {
      const h = this.createChildren(
        n.children.map((u) => this.createWrapper(u).grp)
      );
      i.parentNode.appendChild(h);
    } else
      i.parentNode.children[1].remove();
    this.linkDiv(e.closest("me-main > me-wrapper"));
    const c = e.getBoundingClientRect(), r = {
      x: c.left,
      y: c.top
    }, a = s.x - r.x, d = s.y - r.y;
    this.move(a, d), this.bus.fire("expandNode", n);
  };
  var hn = function(e, t) {
    const n = e.nodeObj, o = e.getBoundingClientRect(), s = {
      x: o.left,
      y: o.top
    };
    U(n, t ?? !n.expanded), this.refresh();
    const i = this.findEle(n.id).getBoundingClientRect(), l = {
      x: i.left,
      y: i.top
    }, c = s.x - l.x, r = s.y - l.y;
    this.move(c, r);
  };
  var fn = function(e) {
    this.clearSelection(), e && (e = JSON.parse(JSON.stringify(e)), this.nodeData = e.nodeData, this.arrows = e.arrows || [], this.summaries = e.summaries || [], e.theme && this.changeTheme(e.theme)), V(this.nodeData), this.layout(), this.linkDiv();
  };
  var un = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    cancelFocus: rn,
    clearSelection: Kt,
    disableEdit: Zt,
    enableEdit: Jt,
    expandNode: dn,
    expandNodeAll: hn,
    focusNode: sn,
    getData: Ut,
    getDataString: qt,
    initLeft: ln,
    initRight: cn,
    initSide: an,
    install: on,
    move: tn,
    refresh: fn,
    scale: Qt,
    scaleFit: en,
    scrollIntoView: Ft,
    selectNode: Gt,
    selectNodes: Vt,
    stringifyData: Le,
    toCenter: nn,
    unselectNodes: zt
  }, Symbol.toStringTag, { value: "Module" }));
  var Oe = "MIND-ELIXIR-WAIT-COPY";
  var pn = (e, t) => {
    const n = e.map.querySelectorAll(`.${t}>me-wrapper>me-parent>me-tpc`);
    n.length !== 0 && e.selectNode(n[Math.ceil(n.length / 2) - 1]);
  };
  var gn = (e) => {
    e.selectNode(e.map.querySelector("me-root>me-tpc"));
  };
  var mn = function(e, t) {
    const n = t.parentElement.parentElement.parentElement.previousSibling;
    if (n) {
      const o = n.firstChild;
      e.selectNode(o);
    }
  };
  var yn = function(e, t) {
    const n = t.parentElement.nextSibling;
    if (n && n.firstChild) {
      const o = n.firstChild.firstChild.firstChild;
      e.selectNode(o);
    }
  };
  var $e = function(e, t) {
    const n = e.currentNode || e.currentNodes?.[0];
    if (!n) return;
    const o = n.nodeObj, s = n.offsetParent.offsetParent.parentElement;
    o.parent ? s.className === t ? yn(e, n) : o.parent?.parent ? mn(e, n) : gn(e) : pn(e, t);
  };
  var He = function(e, t) {
    const n = e.currentNode;
    if (!n || !n.nodeObj.parent) return;
    const s = t + "Sibling", i = n.parentElement.parentElement[s];
    i ? e.selectNode(i.firstChild.firstChild) : e.selectNode(n);
  };
  var ae = function(e, t, n) {
    const { scaleVal: o, scaleSensitivity: s } = e;
    switch (t) {
      case "in":
        e.scale(o + s, n);
        break;
      case "out":
        e.scale(o - s, n);
    }
  };
  function bn(e, t) {
    t = t === true ? {} : t;
    const n = () => {
      e.currentArrow ? e.removeArrow() : e.currentSummary ? e.removeSummary(e.currentSummary.summaryObj.id) : e.currentNodes && e.removeNodes(e.currentNodes);
    };
    let o = false, s = null;
    const i = (r) => {
      const a = e.nodeData;
      if (r.key === "0")
        for (const d of a.children)
          U(d, false);
      if (r.key === "=")
        for (const d of a.children)
          U(d, true);
      if (["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(r.key))
        for (const d of a.children)
          U(d, true, Number(r.key) - 1);
      e.refresh(), e.toCenter(), o = false, s && (clearTimeout(s), s = null, e.container.removeEventListener("keydown", i));
    }, l = {
      Enter: (r) => {
        r.shiftKey ? e.insertSibling("before") : r.ctrlKey || r.metaKey ? e.insertParent() : e.insertSibling("after");
      },
      Tab: () => {
        e.addChild();
      },
      F1: () => {
        e.toCenter();
      },
      F2: () => {
        e.currentSummary ? e.editSummary(e.currentSummary) : e.currentArrow ? e.editArrowLabel(e.currentArrow) : e.beginEdit();
      },
      ArrowUp: (r) => {
        if (r.altKey)
          e.moveUpNode();
        else {
          if (r.metaKey || r.ctrlKey)
            return e.initSide();
          He(e, "previous");
        }
      },
      ArrowDown: (r) => {
        r.altKey ? e.moveDownNode() : He(e, "next");
      },
      ArrowLeft: (r) => {
        if (r.metaKey || r.ctrlKey)
          return e.initLeft();
        $e(e, B.LHS);
      },
      ArrowRight: (r) => {
        if (r.metaKey || r.ctrlKey)
          return e.initRight();
        $e(e, B.RHS);
      },
      PageUp: () => e.moveUpNode(),
      PageDown: () => {
        e.moveDownNode();
      },
      "=": (r) => {
        (r.metaKey || r.ctrlKey) && ae(e, "in");
      },
      "-": (r) => {
        (r.metaKey || r.ctrlKey) && ae(e, "out");
      },
      0: (r) => {
        if (r.metaKey || r.ctrlKey) {
          if (o)
            return;
          e.scale(1);
        }
      },
      k: (r) => {
        (r.metaKey || r.ctrlKey) && (o = true, s && (clearTimeout(s), e.container.removeEventListener("keydown", i)), s = window.setTimeout(() => {
          o = false, s = null;
        }, 2e3), e.container.addEventListener("keydown", i));
      },
      Delete: n,
      Backspace: n,
      ...t
    };
    e.container.onkeydown = (r) => {
      if ((r.ctrlKey || r.metaKey) && ["c", "v", "x"].includes(r.key) || r.preventDefault(), !e.editable) return;
      const d = l[r.key];
      d && d(r);
    };
    const c = (r) => {
      if (r.target instanceof HTMLElement && r.target.id === "input-box" || e.currentNodes.length === 0) return false;
      if (r.clipboardData) {
        const a = Ce(e.currentNodes).map((h) => h.nodeObj), d = Le({
          magic: Oe,
          data: a
        });
        return r.clipboardData.setData("text/plain", d), r.preventDefault(), true;
      }
      return false;
    };
    e.container.addEventListener("copy", c), e.container.addEventListener("cut", (r) => {
      c(r) && n();
    }), e.container.addEventListener("paste", (r) => {
      const a = r.clipboardData?.getData("text/plain");
      if (a)
        try {
          const d = JSON.parse(a);
          if (d && d.magic === Oe && Array.isArray(d.data)) {
            const h = d.data, u = h.map((y) => ({ nodeObj: y }));
            h.length > 0 && e.currentNode && (e.copyNodes(u, e.currentNode), r.preventDefault());
            return;
          }
        } catch {
        }
      e.pasteHandler && e.pasteHandler(r);
    });
  }
  var vn = function(e, t) {
    if (!t)
      return he(e), e;
    let n = e.querySelector(".insert-preview");
    const o = `insert-preview ${t} show`;
    return n || (n = document.createElement("div"), e.appendChild(n)), n.className = o, e;
  };
  var he = function(e) {
    if (!e) return;
    const t = e.querySelectorAll(".insert-preview");
    for (const n of t || [])
      n.remove();
  };
  var je = function(e, t) {
    for (const n of t) {
      const o = n.parentElement.parentElement.contains(e);
      if (!(e && e.tagName === "ME-TPC" && e !== n && !o && e.nodeObj.parent)) return false;
    }
    return true;
  };
  var wn = function(e) {
    const t = document.createElement("div");
    return t.className = "mind-elixir-ghost", e.container.appendChild(t), t;
  };
  var xn = class {
    mind;
    isMoving = false;
    interval = null;
    speed = 20;
    constructor(t) {
      this.mind = t;
    }
    move(t, n) {
      this.isMoving || (this.isMoving = true, this.interval = setInterval(() => {
        this.mind.move(t * this.speed * this.mind.scaleVal, n * this.speed * this.mind.scaleVal);
      }, 100));
    }
    stop() {
      this.isMoving = false, this.interval && (clearInterval(this.interval), this.interval = null);
    }
  };
  function En(e) {
    return {
      isDragging: false,
      insertType: null,
      meet: null,
      ghost: wn(e),
      edgeMoveController: new xn(e),
      startX: 0,
      startY: 0,
      pointerId: null
    };
  }
  var Cn = 5;
  function Ie(e, t, n, o = false) {
    if (e.spacePressed) return false;
    const s = n.target;
    if (s?.tagName !== "ME-TPC" || !s.nodeObj.parent) return false;
    t.startX = n.clientX, t.startY = n.clientY, t.pointerId = n.pointerId, e.selection?.cancel();
    let i = e.currentNodes;
    return i?.includes(s) || (e.selectNode(s), i = e.currentNodes), e.dragged = i, o && it(e, t), true;
  }
  function st(e, t, n) {
    e.style.transform = `translate(${t - 10}px, ${n - 10}px)`, e.style.display = "block";
  }
  function it(e, t) {
    const { dragged: n } = e;
    if (!n) return;
    const o = document.activeElement;
    o && o.isContentEditable && o.blur(), t.isDragging = true, n.length > 1 ? t.ghost.innerHTML = n.length + "" : t.ghost.innerHTML = n[0].innerHTML;
    for (const s of n)
      s.parentElement.parentElement.style.opacity = "0.5";
    e.dragMoveHelper.clear();
  }
  function Sn(e, t, n) {
    const { dragged: o } = e;
    if (!o || t.pointerId !== n.pointerId) return;
    const s = n.clientX - t.startX, i = n.clientY - t.startY, l = Math.sqrt(s * s + i * i);
    if (!t.isDragging && l > Cn && it(e, t), !t.isDragging) return;
    const c = e.container.getBoundingClientRect();
    st(t.ghost, n.clientX - c.x, n.clientY - c.y), n.clientX < c.x + 50 ? t.edgeMoveController.move(1, 0) : n.clientX > c.x + c.width - 50 ? t.edgeMoveController.move(-1, 0) : n.clientY < c.y + 50 ? t.edgeMoveController.move(0, 1) : n.clientY > c.y + c.height - 50 ? t.edgeMoveController.move(0, -1) : t.edgeMoveController.stop(), he(t.meet);
    const r = 12 * e.scaleVal, a = document.elementFromPoint(n.clientX, n.clientY - r);
    if (je(a, o)) {
      t.meet = a;
      const d = a.getBoundingClientRect(), h = d.y;
      n.clientY > h + d.height ? t.insertType = "after" : t.insertType = "in";
    } else {
      const d = document.elementFromPoint(n.clientX, n.clientY + r);
      if (je(d, o)) {
        t.meet = d;
        const u = d.getBoundingClientRect().y;
        n.clientY < u ? t.insertType = "before" : t.insertType = "in";
      } else
        t.insertType = null, t.meet = null;
    }
    t.meet && vn(t.meet, t.insertType);
  }
  function Nn(e, t, n) {
    const { dragged: o } = e;
    if (!(!o || t.pointerId !== n.pointerId)) {
      t.edgeMoveController.stop();
      for (const s of o)
        s.parentElement.parentElement.style.opacity = "1";
      t.ghost.style.display = "none", t.ghost.innerHTML = "", t.isDragging && t.meet && (he(t.meet), t.insertType === "before" ? e.moveNodeBefore(o, t.meet) : t.insertType === "after" ? e.moveNodeAfter(o, t.meet) : t.insertType === "in" && e.moveNodeIn(o, t.meet)), e.dragged = null, t.isDragging = false, t.insertType = null, t.meet = null, t.pointerId = null;
    }
  }
  function pe(e, t) {
    const { dragged: n } = e;
    if (n) {
      t.edgeMoveController.stop();
      for (const o of n)
        o.parentElement.parentElement.style.opacity = "1";
      t.meet && he(t.meet), t.ghost.style.display = "none", t.ghost.innerHTML = "", e.dragged = null, t.isDragging = false, t.insertType = null, t.meet = null, t.pointerId = null;
    }
  }
  function Tn(e) {
    return () => {
    };
  }
  function _n(e) {
    const { dragMoveHelper: t } = e;
    let n = 0;
    e.spacePressed = false;
    let o = null;
    const s = /* @__PURE__ */ new Map(), i = En(e);
    let l = null, c = null, r = null, a = null;
    const d = 500, h = 10, u = () => {
      l !== null && (clearTimeout(l), l = null, c = null, r = null, a = null);
    }, y = (f, w) => {
      f.hasPointerCapture && f.hasPointerCapture(w) && f.releasePointerCapture(w);
    }, b = (f, w) => {
      if (f.id === "input-box" || f.closest("#input-box")) return false;
      const T = f.closest(".svg-label");
      if (T) {
        const M = T.dataset.svgId, te = T.dataset.type, Z = document.getElementById(M);
        if (Z) {
          if (te === "arrow")
            return w ? e.editArrowLabel(Z) : e.selectArrow(Z), true;
          if (te === "summary")
            return w ? e.editSummary(Z) : e.selectSummary(Z), true;
        }
      }
      if (f.closest(".topiclinks")) {
        const M = f.closest("g");
        if (M)
          return w ? e.editArrowLabel(M) : e.selectArrow(M), true;
      }
      if (f.closest(".summary")) {
        const M = f.closest("g");
        if (M)
          return w ? e.editSummary(M) : e.selectSummary(M), true;
      }
      return false;
    }, p = (f) => {
      if (f.button !== 0) return;
      if (e.helper1?.moved) {
        e.helper1.clear();
        return;
      }
      if (e.helper2?.moved) {
        e.helper2.clear();
        return;
      }
      if (t.moved) {
        t.clear();
        return;
      }
      if (i?.isDragging)
        return;
      const w = f.target;
      if (w.tagName === "ME-EPD")
        f.ctrlKey || f.metaKey ? e.expandNodeAll(w.previousSibling) : e.expandNode(w.previousSibling);
      else if (w.tagName === "ME-TPC" && e.currentNodes.length > 1)
        e.selectNode(w);
      else if (!e.editable)
        return;
      b(w, false);
    }, g = (f) => {
      if (!e.editable) return;
      const w = f.target;
      re(w) && e.beginEdit(w), b(w, true);
    }, m = (f) => {
      if (f.pointerType === "mouse" || s.size > 1) return;
      const w = (/* @__PURE__ */ new Date()).getTime(), T = w - n;
      T < 300 && T > 0 && g(f), n = w;
    }, v = (f) => {
      f.code === "Space" && (e.spacePressed = true, e.container.classList.add("space-pressed"));
    }, E = (f) => {
      f.code === "Space" && (e.spacePressed = false, e.container.classList.remove("space-pressed"));
    }, k = (f) => {
      if (f.pointerType === "touch" && (s.set(f.pointerId, { x: f.clientX, y: f.clientY }), s.size === 2)) {
        const [M, te] = Array.from(s.values());
        o = Pe(M, te), u();
      }
      t.moved = false;
      const w = f.target, T = e.mouseSelectionButton === 0 ? 2 : 0;
      if (e.editable && i && (f.button === 0 || f.pointerType === "touch")) {
        if (f.pointerType === "touch" && s.size > 1)
          (i.isDragging || i.pointerId !== null) && pe(e, i);
        else if (f.pointerType === "touch" && s.size === 1)
          (re(w) || w.closest("me-tpc")) && (c = { x: f.clientX, y: f.clientY }, r = w, a = f.pointerId, l = window.setTimeout(() => {
            Ie(e, i, f, true) && (r && r.setPointerCapture(f.pointerId), st(i.ghost, f.clientX, f.clientY)), l = null, c = null, r = null, a = null;
          }, d));
        else if (f.pointerType === "mouse" && Ie(e, i, f, false)) {
          w.setPointerCapture(f.pointerId);
          return;
        }
      }
      const O = e.spacePressed && f.button === 0 && f.pointerType === "mouse", X = !e.editable || f.button === T && f.pointerType === "mouse" || f.pointerType === "touch";
      !O && !X || (t.x = f.clientX, t.y = f.clientY, w.className !== "circle" && w.contentEditable !== "plaintext-only" && (t.mousedown = true, w.setPointerCapture(f.pointerId)));
    }, _ = (f) => {
      if (f.pointerType === "touch" && s.has(f.pointerId)) {
        if (s.set(f.pointerId, { x: f.clientX, y: f.clientY }), l !== null && c !== null && f.pointerId === a) {
          const w = f.clientX - c.x, T = f.clientY - c.y;
          Math.sqrt(w * w + T * T) > h && u();
        }
        if (s.size >= 2) {
          const [w, T] = Array.from(s.values()), O = Pe(w, T);
          if (o == null)
            o = O;
          else {
            if (o > 0) {
              const X = O / o;
              e.scale(e.scaleVal * X, {
                x: (w.x + T.x) / 2,
                y: (w.y + T.y) / 2
              });
            }
            o = O;
          }
          return;
        }
      }
      if (!(i && i.pointerId !== null && (Sn(e, i, f), i.isDragging))) {
        if (f.target.contentEditable !== "plaintext-only" || e.spacePressed && t.mousedown) {
          const w = f.clientX - t.x, T = f.clientY - t.y;
          t.onMove(w, T);
        }
        t.x = f.clientX, t.y = f.clientY;
      }
    }, C = (f) => {
      if (f.pointerType === "touch" && (s.delete(f.pointerId), s.size < 2 && (o = null), u()), i && i.pointerId !== null) {
        const w = i.isDragging;
        if (Nn(e, i, f), y(f.target, f.pointerId), w)
          return;
      }
      t.mousedown && (y(f.target, f.pointerId), t.clear());
    }, x = () => {
      u(), t.mousedown && t.clear(), i && (i.isDragging || i.pointerId !== null) && pe(e, i);
    }, N = (f) => {
      f.pointerType === "touch" && (s.delete(f.pointerId), s.size < 2 && (o = null), u()), i && i.pointerId === f.pointerId && pe(e, i), C(f);
    }, S = (f) => {
      if (f.preventDefault(), f.button !== 2 || !e.editable) return;
      const w = f.target;
      re(w) && !w.classList.contains("selected") && e.selectNode(w), setTimeout(() => {
        e.dragMoveHelper.moved || e.bus.fire("showContextMenu", f);
      }, 200);
    }, A = (f) => {
      f.stopPropagation(), f.preventDefault(), f.ctrlKey || f.metaKey ? f.deltaY < 0 ? ae(e, "in", e.dragMoveHelper) : e.scaleVal - e.scaleSensitivity > 0 && ae(e, "out", e.dragMoveHelper) : f.shiftKey ? e.move(-f.deltaY, 0) : e.move(-f.deltaX, -f.deltaY);
    }, { container: L } = e;
    return Je([
      { dom: L, evt: "pointerdown", func: k },
      { dom: L, evt: "pointermove", func: _ },
      { dom: L, evt: "pointerup", func: C },
      { dom: L, evt: "pointercancel", func: N },
      { dom: L, evt: "pointerdown", func: m },
      { dom: L, evt: "click", func: p },
      { dom: L, evt: "dblclick", func: g },
      { dom: L, evt: "contextmenu", func: S },
      { dom: L, evt: "wheel", func: typeof e.handleWheel == "function" ? e.handleWheel : A },
      { dom: L, evt: "blur", func: x },
      { dom: L, evt: "keydown", func: v },
      { dom: L, evt: "keyup", func: E }
    ]);
  }
  function kn() {
    return {
      handlers: {},
      addListener: function(e, t) {
        this.handlers[e] === void 0 && (this.handlers[e] = []), this.handlers[e].push(t);
      },
      fire: function(e, ...t) {
        if (this.handlers[e] instanceof Array) {
          const n = this.handlers[e];
          for (let o = 0; o < n.length; o++)
            n[o](...t);
        }
      },
      removeListener: function(e, t) {
        if (!this.handlers[e]) return;
        const n = this.handlers[e];
        if (!t)
          n.length = 0;
        else if (n.length)
          for (let o = 0; o < n.length; o++)
            n[o] === t && this.handlers[e].splice(o, 1);
      }
    };
  }
  var j = "http://www.w3.org/2000/svg";
  var fe = function(e) {
    const t = e.clientWidth, n = e.clientHeight, o = e.dataset, s = Number(o.x), i = Number(o.y), l = o.anchor;
    let c = s;
    l === "middle" ? c = s - t / 2 : l === "end" && (c = s - t), e.style.left = `${c}px`, e.style.top = `${i - n / 2}px`, e.style.visibility = "visible";
  };
  var ye = function(e, t, n, o) {
    const { anchor: s = "middle", color: i, dataType: l, svgId: c } = o, r = document.createElement("div");
    r.className = "svg-label", r.style.color = i || "#666";
    const a = "label-" + c;
    return r.id = a, r.innerHTML = e, r.dataset.type = l, r.dataset.svgId = c, r.dataset.x = t.toString(), r.dataset.y = n.toString(), r.dataset.anchor = s, r;
  };
  var rt = function(e, t, n) {
    const o = document.createElementNS(j, "path");
    return D(o, {
      d: e,
      stroke: t || "#666",
      fill: "none",
      "stroke-width": n
    }), o;
  };
  var Q = function(e) {
    const t = document.createElementNS(j, "svg");
    return t.setAttribute("class", e), t.setAttribute("overflow", "visible"), t;
  };
  var Re = function() {
    const e = document.createElementNS(j, "line");
    return e.setAttribute("stroke", "#4dc4ff"), e.setAttribute("fill", "none"), e.setAttribute("stroke-width", "2"), e.setAttribute("opacity", "0.45"), e;
  };
  var Ln = function(e, t, n, o) {
    const s = document.createElementNS(j, "g");
    return [
      {
        name: "line",
        d: e
      },
      {
        name: "arrow1",
        d: t
      },
      {
        name: "arrow2",
        d: n
      }
    ].forEach((l, c) => {
      const r = l.d, a = document.createElementNS(j, "path"), d = {
        d: r,
        stroke: o?.stroke || "rgb(227, 125, 116)",
        fill: "none",
        "stroke-linecap": o?.strokeLinecap || "cap",
        "stroke-width": String(o?.strokeWidth || "2")
      };
      o?.opacity !== void 0 && (d.opacity = String(o.opacity)), D(a, d), c === 0 && a.setAttribute("stroke-dasharray", o?.strokeDasharray || "8,2");
      const h = document.createElementNS(j, "path");
      D(h, {
        d: r,
        stroke: "transparent",
        fill: "none",
        "stroke-width": "15"
      }), s.appendChild(h), s.appendChild(a), s[l.name] = a;
    }), s;
  };
  var lt = function(e, t, n) {
    if (!t) return;
    const o = n.label, s = t.cloneNode(true);
    e.nodes.appendChild(s), s.id = "input-box", s.textContent = o, s.contentEditable = "plaintext-only", s.spellcheck = false, s.style.cssText = `
    left:${t.style.left};
    top:${t.style.top}; 
    max-width: 200px;
  `, Qe(s), e.scrollIntoView(s), s.addEventListener("keydown", (i) => {
      i.stopPropagation();
      const l = i.key;
      if (l === "Enter" || l === "Tab") {
        if (i.shiftKey) return;
        i.preventDefault(), s.blur(), e.container.focus();
      }
    }), s.addEventListener("blur", () => {
      if (!s) return;
      const i = s.innerText?.trim() || "";
      i === "" ? n.label = o : n.label = i, s.remove(), i !== o && (e.markdown ? t.innerHTML = e.markdown(n.label, n) : t.textContent = n.label, fe(t), "parent" in n ? e.bus.fire("operation", {
        name: "finishEditSummary",
        obj: n
      }) : e.bus.fire("operation", {
        name: "finishEditArrowLabel",
        obj: n
      }));
    });
  };
  var Dn = function(e) {
    const t = this.map.querySelector("me-root"), n = t.offsetTop, o = t.offsetLeft, s = t.offsetWidth, i = t.offsetHeight, l = this.map.querySelectorAll("me-main > me-wrapper");
    this.lines.innerHTML = "";
    for (let c = 0; c < l.length; c++) {
      const r = l[c], a = r.querySelector("me-tpc"), { offsetLeft: d, offsetTop: h } = H(this.nodes, a), u = a.offsetWidth, y = a.offsetHeight, b = r.parentNode.className, p = this.generateMainBranch({ pT: n, pL: o, pW: s, pH: i, cT: h, cL: d, cW: u, cH: y, direction: b, containerHeight: this.nodes.offsetHeight }), g = this.theme.palette, m = a.nodeObj.branchColor || g[c % g.length];
      if (a.style.borderColor = m, this.lines.appendChild(rt(p, m, "3")), e && e !== r)
        continue;
      const v = Q("subLines"), E = r.lastChild;
      E.tagName === "svg" && E.remove(), r.appendChild(v), ct(this, v, m, r, b, true);
    }
    this.labelContainer.innerHTML = "", this.renderArrow(), this.renderSummary(), this.bus.fire("linkDiv");
  };
  var ct = function(e, t, n, o, s, i) {
    const l = o.firstChild, c = o.children[1].children;
    if (c.length === 0) return;
    const r = l.offsetTop, a = l.offsetLeft, d = l.offsetWidth, h = l.offsetHeight;
    for (let u = 0; u < c.length; u++) {
      const y = c[u], b = y.firstChild, p = b.offsetTop, g = b.offsetLeft, m = b.offsetWidth, v = b.offsetHeight, E = b.firstChild.nodeObj.branchColor || n, k = e.generateSubBranch({ pT: r, pL: a, pW: d, pH: h, cT: p, cL: g, cW: m, cH: v, direction: s, isFirst: i });
      t.appendChild(rt(k, E, "2"));
      const _ = b.children[1];
      if (_) {
        if (!_.expanded) continue;
      } else
        continue;
      ct(e, t, E, y, s);
    }
  };
  var An = {
    addChild: "Add child",
    addParent: "Add parent",
    addSibling: "Add sibling",
    removeNode: "Remove node",
    focus: "Focus Mode",
    cancelFocus: "Cancel Focus Mode",
    moveUp: "Move up",
    moveDown: "Move down",
    link: "Link",
    linkBidirectional: "Bidirectional Link",
    clickTips: "Please click the target node",
    summary: "Summary"
  };
  function Mn(e, t) {
    const n = {
      focus: true,
      link: true,
      locale: An
    };
    t = t === true ? n : Object.assign(n, t);
    const o = (C) => {
      const x = document.createElement("div");
      return x.innerText = C, x.className = "tips", x;
    }, s = (C, x, N) => {
      const S = document.createElement("li");
      return S.id = C, S.innerHTML = `<span>${me(x)}</span><span ${N ? 'class="key"' : ""}>${me(N)}</span>`, S;
    }, i = t.locale, l = s("cm-add_child", i.addChild, "Tab"), c = s("cm-add_parent", i.addParent, "Ctrl + Enter"), r = s("cm-add_sibling", i.addSibling, "Enter"), a = s("cm-remove_child", i.removeNode, "Delete"), d = s("cm-fucus", i.focus, ""), h = s("cm-unfucus", i.cancelFocus, ""), u = s("cm-up", i.moveUp, "PgUp"), y = s("cm-down", i.moveDown, "Pgdn"), b = s("cm-link", i.link, ""), p = s("cm-link-bidirectional", i.linkBidirectional, ""), g = s("cm-summary", i.summary, ""), m = document.createElement("ul");
    if (m.className = "menu-list", m.appendChild(l), m.appendChild(c), m.appendChild(r), m.appendChild(a), t.focus && (m.appendChild(d), m.appendChild(h)), m.appendChild(u), m.appendChild(y), m.appendChild(g), t.link && (m.appendChild(b), m.appendChild(p)), t && t.extend)
      for (let C = 0; C < t.extend.length; C++) {
        const x = t.extend[C], N = s(x.name, x.name, x.key || "");
        m.appendChild(N), N.onclick = (S) => {
          x.onclick(S);
        };
      }
    const v = document.createElement("div");
    v.className = "context-menu", v.appendChild(m), v.hidden = true, e.container.append(v);
    let E = true;
    const k = (C) => {
      const x = C.target;
      if (re(x)) {
        x.parentElement.tagName === "ME-ROOT" ? E = true : E = false, E ? (d.className = "disabled", u.className = "disabled", y.className = "disabled", c.className = "disabled", r.className = "disabled", a.className = "disabled") : (d.className = "", u.className = "", y.className = "", c.className = "", r.className = "", a.className = ""), v.hidden = false, m.style.top = "", m.style.bottom = "", m.style.left = "", m.style.right = "";
        const N = m.offsetHeight, S = m.offsetWidth, A = m.getBoundingClientRect(), L = C.clientY - A.top, R = C.clientX - A.left;
        N + L > window.innerHeight ? (m.style.top = "", m.style.bottom = "0px") : (m.style.bottom = "", m.style.top = L + 15 + "px"), S + R > window.innerWidth ? (m.style.left = "", m.style.right = "0px") : (m.style.right = "", m.style.left = R + 10 + "px");
      }
    };
    e.bus.addListener("showContextMenu", k), v.onclick = (C) => {
      C.target === v && (v.hidden = true);
    }, l.onclick = () => {
      e.addChild(), v.hidden = true;
    }, c.onclick = () => {
      e.insertParent(), v.hidden = true;
    }, r.onclick = () => {
      E || (e.insertSibling("after"), v.hidden = true);
    }, a.onclick = () => {
      E || (e.removeNodes(e.currentNodes || []), v.hidden = true);
    }, d.onclick = () => {
      E || (e.focusNode(e.currentNode), v.hidden = true);
    }, h.onclick = () => {
      e.cancelFocus(), v.hidden = true;
    }, u.onclick = () => {
      E || (e.moveUpNode(), v.hidden = true);
    }, y.onclick = () => {
      E || (e.moveDownNode(), v.hidden = true);
    };
    const _ = (C) => {
      v.hidden = true;
      const x = e.currentNode, N = o(i.clickTips);
      e.container.appendChild(N), e.map.addEventListener(
        "click",
        (S) => {
          S.preventDefault(), N.remove();
          const A = S.target;
          (A.parentElement.tagName === "ME-PARENT" || A.parentElement.tagName === "ME-ROOT") && e.createArrow(x, A, C);
        },
        {
          once: true
        }
      );
    };
    return b.onclick = () => _(), p.onclick = () => _({ bidirectional: true }), g.onclick = () => {
      v.hidden = true, e.createSummary(), e.unselectNodes(e.currentNodes);
    }, () => {
      l.onclick = null, c.onclick = null, r.onclick = null, a.onclick = null, d.onclick = null, h.onclick = null, u.onclick = null, y.onclick = null, b.onclick = null, g.onclick = null, v.onclick = null, e.container.oncontextmenu = null;
    };
  }
  var Pn = function(e) {
    return ["createSummary", "removeSummary", "finishEditSummary"].includes(e.name) ? {
      type: "summary",
      value: e.obj.id
    } : ["createArrow", "removeArrow", "finishEditArrowLabel"].includes(e.name) ? {
      type: "arrow",
      value: e.obj.id
    } : ["removeNodes", "copyNodes", "moveNodeBefore", "moveNodeAfter", "moveNodeIn"].includes(e.name) ? {
      type: "nodes",
      value: e.objs.map((t) => t.id)
    } : {
      type: "nodes",
      value: [e.obj.id]
    };
  };
  function On(e) {
    let t = [], n = -1, o = e.getData(), s = [];
    e.undo = function() {
      if (n > -1) {
        const r = t[n];
        o = r.prev, e.refresh(r.prev);
        try {
          r.currentTarget.type === "nodes" && (r.operation === "removeNodes" ? e.selectNodes(r.currentTarget.value.map((a) => this.findEle(a))) : e.selectNodes(r.currentSelected.map((a) => this.findEle(a))));
        } catch {
        } finally {
          n--;
        }
      }
    }, e.redo = function() {
      if (n < t.length - 1) {
        n++;
        const r = t[n];
        o = r.next, e.refresh(r.next);
        try {
          r.currentTarget.type === "nodes" && (r.operation === "removeNodes" ? e.selectNodes(r.currentSelected.map((a) => this.findEle(a))) : e.selectNodes(r.currentTarget.value.map((a) => this.findEle(a))));
        } catch {
        }
      }
    }, e.clearHistory = function() {
      t = [], n = -1, o = e.getData(), e.clearSelection();
    };
    const i = function(r) {
      if (r.name === "beginEdit") return;
      t = t.slice(0, n + 1);
      const a = e.getData(), d = {
        prev: o,
        operation: r.name,
        currentSelected: s.map((h) => h.id),
        currentTarget: Pn(r),
        next: a
      };
      t.push(d), o = a, n = t.length - 1;
    }, l = function(r) {
      (r.metaKey || r.ctrlKey) && (r.shiftKey && r.key === "Z" || r.key === "y") ? e.redo() : (r.metaKey || r.ctrlKey) && r.key === "z" && e.undo();
    }, c = function() {
      s = e.currentNodes.map((r) => r.nodeObj);
    };
    return e.bus.addListener("operation", i), e.bus.addListener("selectNodes", c), e.container.addEventListener("keydown", l), () => {
      e.bus.removeListener("operation", i), e.bus.removeListener("selectNodes", c), e.container.removeEventListener("keydown", l);
    };
  }
  var $n = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1750169394918" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2021" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M851.91168 328.45312c-59.97056 0-108.6208 48.47104-108.91264 108.36992l-137.92768 38.4a109.14304 109.14304 0 0 0-63.46752-46.58688l1.39264-137.11872c47.29344-11.86816 82.31936-54.66624 82.31936-105.64096 0-60.15488-48.76288-108.91776-108.91776-108.91776s-108.91776 48.76288-108.91776 108.91776c0 49.18784 32.60928 90.75712 77.38368 104.27392l-1.41312 138.87488a109.19936 109.19936 0 0 0-63.50336 48.55808l-138.93632-39.48544 0.01024-0.72704c0-60.15488-48.76288-108.91776-108.91776-108.91776s-108.91776 48.75776-108.91776 108.91776c0 60.15488 48.76288 108.91264 108.91776 108.91264 39.3984 0 73.91232-20.92032 93.03552-52.2496l139.19232 39.552-0.00512 0.2304c0 25.8304 9.00096 49.5616 24.02816 68.23424l-90.14272 132.63872a108.7488 108.7488 0 0 0-34.2528-5.504c-60.15488 0-108.91776 48.768-108.91776 108.91776 0 60.16 48.76288 108.91776 108.91776 108.91776 60.16 0 108.92288-48.75776 108.92288-108.91776 0-27.14624-9.9328-51.968-26.36288-71.04l89.04704-131.03104a108.544 108.544 0 0 0 37.6832 6.70208 108.672 108.672 0 0 0 36.48512-6.272l93.13792 132.57216a108.48256 108.48256 0 0 0-24.69888 69.0688c0 60.16 48.768 108.92288 108.91776 108.92288 60.16 0 108.91776-48.76288 108.91776-108.92288 0-60.14976-48.75776-108.91776-108.91776-108.91776a108.80512 108.80512 0 0 0-36.69504 6.3488l-93.07136-132.48a108.48768 108.48768 0 0 0 24.79616-72.22784l136.09984-37.888c18.99008 31.93856 53.84192 53.3504 93.69088 53.3504 60.16 0 108.92288-48.75776 108.92288-108.91264-0.00512-60.15488-48.77312-108.92288-108.92288-108.92288z" p-id="2022"></path></svg>';
  var Hn = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1750169375313" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1775" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M639 463.30000001L639 285.1c0-36.90000001-26.4-68.5-61.3-68.5l-150.2 0c-1.5 0-3 0.1-4.5 0.3-10.2-38.7-45.5-67.3-87.5-67.3-50 0-90.5 40.5-90.5 90.5s40.5 90.5 90.5 90.5c42 0 77.3-28.6 87.5-67.39999999 1.4 0.3 2.9 0.4 4.5 0.39999999L577.7 263.6c6.8 0 14.3 8.9 14.3 21.49999999l0 427.00000001c0 12.7-7.40000001 21.5-14.30000001 21.5l-150.19999999 0c-1.5 0-3 0.2-4.5 0.4-10.2-38.8-45.5-67.3-87.5-67.3-50 0-90.5 40.5-90.5 90.4 0 49.9 40.5 90.6 90.5 90.59999999 42 0 77.3-28.6 87.5-67.39999999 1.4 0.2 2.9 0.4 4.49999999 0.4L577.7 780.7c34.80000001 0 61.3-31.6 61.3-68.50000001L639 510.3l79.1 0c10.4 38.5 45.49999999 67 87.4 67 50 0 90.5-40.5 90.5-90.5s-40.5-90.5-90.5-90.5c-41.79999999 0-77.00000001 28.4-87.4 67L639 463.30000001z" fill="currentColor" p-id="1776"></path></svg>';
  var jn = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1750169667709" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3037" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M385 560.69999999L385 738.9c0 36.90000001 26.4 68.5 61.3 68.5l150.2 0c1.5 0 3-0.1 4.5-0.3 10.2 38.7 45.5 67.3 87.5 67.3 50 0 90.5-40.5 90.5-90.5s-40.5-90.5-90.5-90.5c-42 0-77.3 28.6-87.5 67.39999999-1.4-0.3-2.9-0.4-4.5-0.39999999L446.3 760.4c-6.8 0-14.3-8.9-14.3-21.49999999l0-427.00000001c0-12.7 7.40000001-21.5 14.30000001-21.5l150.19999999 0c1.5 0 3-0.2 4.5-0.4 10.2 38.8 45.5 67.3 87.5 67.3 50 0 90.5-40.5 90.5-90.4 0-49.9-40.5-90.6-90.5-90.59999999-42 0-77.3 28.6-87.5 67.39999999-1.4-0.2-2.9-0.4-4.49999999-0.4L446.3 243.3c-34.80000001 0-61.3 31.6-61.3 68.50000001L385 513.7l-79.1 0c-10.4-38.5-45.49999999-67-87.4-67-50 0-90.5 40.5-90.5 90.5s40.5 90.5 90.5 90.5c41.79999999 0 77.00000001-28.4 87.4-67L385 560.69999999z" fill="currentColor" p-id="3038"></path></svg>';
  var In = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1750169402629" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2170" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M639.328 416c8.032 0 16.096-3.008 22.304-9.056l202.624-197.184-0.8 143.808c-0.096 17.696 14.144 32.096 31.808 32.192 0.064 0 0.128 0 0.192 0 17.6 0 31.904-14.208 32-31.808l1.248-222.208c0-0.672-0.352-1.248-0.384-1.92 0.032-0.512 0.288-0.896 0.288-1.408 0.032-17.664-14.272-32-31.968-32.032L671.552 96l-0.032 0c-17.664 0-31.968 14.304-32 31.968C639.488 145.632 653.824 160 671.488 160l151.872 0.224-206.368 200.8c-12.672 12.32-12.928 32.608-0.64 45.248C622.656 412.736 630.976 416 639.328 416z" p-id="2171"></path><path d="M896.032 639.552 896.032 639.552c-17.696 0-32 14.304-32.032 31.968l-0.224 151.872-200.832-206.4c-12.32-12.64-32.576-12.96-45.248-0.64-12.672 12.352-12.928 32.608-0.64 45.248l197.184 202.624-143.808-0.8c-0.064 0-0.128 0-0.192 0-17.6 0-31.904 14.208-32 31.808-0.096 17.696 14.144 32.096 31.808 32.192l222.24 1.248c0.064 0 0.128 0 0.192 0 0.64 0 1.12-0.32 1.76-0.352 0.512 0.032 0.896 0.288 1.408 0.288l0.032 0c17.664 0 31.968-14.304 32-31.968L928 671.584C928.032 653.952 913.728 639.584 896.032 639.552z" p-id="2172"></path><path d="M209.76 159.744l143.808 0.8c0.064 0 0.128 0 0.192 0 17.6 0 31.904-14.208 32-31.808 0.096-17.696-14.144-32.096-31.808-32.192L131.68 95.328c-0.064 0-0.128 0-0.192 0-0.672 0-1.248 0.352-1.888 0.384-0.448 0-0.8-0.256-1.248-0.256 0 0-0.032 0-0.032 0-17.664 0-31.968 14.304-32 31.968L96 352.448c-0.032 17.664 14.272 32 31.968 32.032 0 0 0.032 0 0.032 0 17.664 0 31.968-14.304 32-31.968l0.224-151.936 200.832 206.4c6.272 6.464 14.624 9.696 22.944 9.696 8.032 0 16.096-3.008 22.304-9.056 12.672-12.32 12.96-32.608 0.64-45.248L209.76 159.744z" p-id="2173"></path><path d="M362.368 617.056l-202.624 197.184 0.8-143.808c0.096-17.696-14.144-32.096-31.808-32.192-0.064 0-0.128 0-0.192 0-17.6 0-31.904 14.208-32 31.808l-1.248 222.24c0 0.704 0.352 1.312 0.384 2.016 0 0.448-0.256 0.832-0.256 1.312-0.032 17.664 14.272 32 31.968 32.032L352.448 928c0 0 0.032 0 0.032 0 17.664 0 31.968-14.304 32-31.968s-14.272-32-31.968-32.032l-151.936-0.224 206.4-200.832c12.672-12.352 12.96-32.608 0.64-45.248S375.008 604.704 362.368 617.056z" p-id="2174"></path></svg>';
  var Rn = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1750169573443" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2883" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M514.133333 488.533333m-106.666666 0a106.666667 106.666667 0 1 0 213.333333 0 106.666667 106.666667 0 1 0-213.333333 0Z" fill="currentColor" p-id="2884"></path><path d="M512 64C264.533333 64 64 264.533333 64 512c0 236.8 183.466667 428.8 416 445.866667v-134.4c-53.333333-59.733333-200.533333-230.4-200.533333-334.933334 0-130.133333 104.533333-234.666667 234.666666-234.666666s234.666667 104.533333 234.666667 234.666666c0 61.866667-49.066667 153.6-145.066667 270.933334l-59.733333 68.266666V960C776.533333 942.933333 960 748.8 960 512c0-247.466667-200.533333-448-448-448z" fill="currentColor" p-id="2885"></path></svg>';
  var Bn = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1750169419447" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2480" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M863.328 482.56l-317.344-1.12L545.984 162.816c0-17.664-14.336-32-32-32s-32 14.336-32 32l0 318.4L159.616 480.064c-0.032 0-0.064 0-0.096 0-17.632 0-31.936 14.24-32 31.904C127.424 529.632 141.728 544 159.392 544.064l322.592 1.152 0 319.168c0 17.696 14.336 32 32 32s32-14.304 32-32l0-318.944 317.088 1.12c0.064 0 0.096 0 0.128 0 17.632 0 31.936-14.24 32-31.904C895.264 496.992 880.96 482.624 863.328 482.56z" p-id="2481"></path></svg>';
  var Yn = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1750169426515" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2730" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M863.744 544 163.424 544c-17.664 0-32-14.336-32-32s14.336-32 32-32l700.32 0c17.696 0 32 14.336 32 32S881.44 544 863.744 544z" p-id="2731"></path></svg>';
  var Wn = {
    side: $n,
    left: Hn,
    right: jn,
    full: In,
    living: Rn,
    zoomin: Bn,
    zoomout: Yn
  };
  var G = (e, t) => {
    const n = document.createElement("span");
    return n.id = e, n.innerHTML = Wn[t], n;
  };
  function Xn(e) {
    const t = document.createElement("div"), n = G("fullscreen", "full"), o = G("toCenter", "living"), s = G("zoomout", "zoomout"), i = G("zoomin", "zoomin");
    t.appendChild(n), t.appendChild(o), t.appendChild(s), t.appendChild(i), t.className = "mind-elixir-toolbar rb";
    let l = null;
    const c = () => {
      const a = e.container.getBoundingClientRect(), d = Se(e.map.style.transform), h = a.width / 2, u = a.height / 2, y = (h - d.x) / e.scaleVal, b = (u - d.y) / e.scaleVal;
      l = {
        containerRect: a,
        currentTransform: d,
        mapCenterX: y,
        mapCenterY: b
      };
    }, r = () => {
      if (l) {
        const a = e.container.getBoundingClientRect(), d = a.width / 2, h = a.height / 2, u = d - l.mapCenterX * e.scaleVal, y = h - l.mapCenterY * e.scaleVal, b = u - l.currentTransform.x, p = y - l.currentTransform.y;
        e.move(b, p);
      }
    };
    return e.el.addEventListener("fullscreenchange", r), n.onclick = () => {
      c(), document.fullscreenElement !== e.el ? e.el.requestFullscreen() : document.exitFullscreen();
    }, o.onclick = () => {
      e.toCenter();
    }, s.onclick = () => {
      e.scale(e.scaleVal - e.scaleSensitivity);
    }, i.onclick = () => {
      e.scale(e.scaleVal + e.scaleSensitivity);
    }, t;
  }
  function Fn(e) {
    const t = document.createElement("div"), n = G("tbltl", "left"), o = G("tbltr", "right"), s = G("tblts", "side");
    return t.appendChild(n), t.appendChild(o), t.appendChild(s), t.className = "mind-elixir-toolbar lt", n.onclick = () => {
      e.initLeft();
    }, o.onclick = () => {
      e.initRight();
    }, s.onclick = () => {
      e.initSide();
    }, t;
  }
  function Gn(e) {
    e.container.append(Xn(e)), e.container.append(Fn(e));
  }
  var Vn = class {
    _listeners = /* @__PURE__ */ new Map();
    addEventListener(t, n) {
      const o = this._listeners.get(t) ?? /* @__PURE__ */ new Set();
      return this._listeners.set(t, o), o.add(n), this;
    }
    removeEventListener(t, n) {
      return this._listeners.get(t)?.delete(n), this;
    }
    dispatchEvent(t, ...n) {
      let o = true;
      for (const s of this._listeners.get(t) ?? [])
        o = s(...n) !== false && o;
      return o;
    }
    unbindAllListeners() {
      this._listeners.clear();
    }
    // Let's also support on, off and emit like node
    on = this.addEventListener;
    off = this.removeEventListener;
    emit = this.dispatchEvent;
  };
  var Be = (e, t = "px") => typeof e == "number" ? e + t : e;
  var Y = ({ style: e }, t, n) => {
    if (typeof t == "object")
      for (const [o, s] of Object.entries(t))
        s !== void 0 && (e[o] = Be(s));
    else n !== void 0 && (e[t] = Be(n));
  };
  var Ye = (e = 0, t = 0, n = 0, o = 0) => {
    const s = { x: e, y: t, width: n, height: o, top: t, left: e, right: e + n, bottom: t + o };
    return { ...s, toJSON: () => JSON.stringify(s) };
  };
  var zn = (e) => {
    let t, n = -1, o = false;
    return {
      next: (...s) => {
        t = s, o || (o = true, n = requestAnimationFrame(() => {
          e(...t), o = false;
        }));
      },
      cancel: () => {
        cancelAnimationFrame(n), o = false;
      }
    };
  };
  var We = (e, t, n = "touch") => {
    switch (n) {
      case "center": {
        const o = t.left + t.width / 2, s = t.top + t.height / 2;
        return o >= e.left && o <= e.right && s >= e.top && s <= e.bottom;
      }
      case "cover":
        return t.left >= e.left && t.top >= e.top && t.right <= e.right && t.bottom <= e.bottom;
      case "touch":
        return e.right >= t.left && e.left <= t.right && e.bottom >= t.top && e.top <= t.bottom;
    }
  };
  var Kn = () => matchMedia("(hover: none), (pointer: coarse)").matches;
  var qn = () => "safari" in window;
  var be = (e) => Array.isArray(e) ? e : [e];
  var at = (e) => (t, n, o, s = {}) => {
    (t instanceof HTMLCollection || t instanceof NodeList) && (t = Array.from(t)), n = be(n), t = be(t);
    for (const i of t)
      if (i)
        for (const l of n)
          i[e](l, o, { capture: false, ...s });
  };
  var W = at("addEventListener");
  var $ = at("removeEventListener");
  var ne = (e) => {
    const { clientX: t, clientY: n, target: o } = e.touches?.[0] ?? e;
    return { x: t, y: n, target: o };
  };
  var K = (e, t = document) => be(e).map((n) => typeof n == "string" ? Array.from(t.querySelectorAll(n)) : n instanceof Element ? n : null).flat().filter(Boolean);
  var Un = (e, t) => t.some((n) => typeof n == "number" ? e.button === n : typeof n == "object" ? n.button !== e.button ? false : n.modifiers.every((o) => {
    switch (o) {
      case "alt":
        return e.altKey;
      case "ctrl":
        return e.ctrlKey || e.metaKey;
      case "shift":
        return e.shiftKey;
    }
  }) : false);
  var { abs: F, max: Xe, min: Fe, ceil: Ge } = Math;
  var Ve = (e = []) => ({
    stored: e,
    selected: [],
    touched: [],
    changed: { added: [], removed: [] }
  });
  var Jn = class extends Vn {
    static version = "mind-elixir-fork";
    // Options
    _options;
    // Selection store
    _selection = Ve();
    // Area element and clipping element
    _area;
    _clippingElement;
    // Target container (element) and boundary (cached)
    _targetElement;
    _targetBoundary;
    _targetBoundaryScrolled = true;
    _targetRect;
    _selectables = [];
    _latestElement;
    // Dynamically constructed area rect
    _areaLocation = { y1: 0, x2: 0, y2: 0, x1: 0 };
    _areaRect = Ye();
    // If a single click is being performed, it's a single-click until the user dragged the mouse
    _singleClick = true;
    _frame;
    // Required data for scrolling
    _scrollAvailable = true;
    _scrollingActive = false;
    _scrollSpeed = { x: 0, y: 0 };
    _scrollDelta = { x: 0, y: 0 };
    // Required for keydown scrolling
    _lastMousePosition = { x: 0, y: 0 };
    constructor(t) {
      super(), this._options = {
        selectionAreaClass: "selection-area",
        selectionContainerClass: void 0,
        selectables: [],
        document: window.document,
        startAreas: ["html"],
        boundaries: ["html"],
        container: "body",
        mindElixirInstance: void 0,
        // 添加默认值
        ...t,
        behaviour: {
          overlap: "invert",
          intersect: "touch",
          triggers: [0],
          ...t.behaviour,
          startThreshold: t.behaviour?.startThreshold ? typeof t.behaviour.startThreshold == "number" ? t.behaviour.startThreshold : { x: 10, y: 10, ...t.behaviour.startThreshold } : { x: 10, y: 10 },
          scrolling: {
            speedDivider: 10,
            manualSpeed: 750,
            ...t.behaviour?.scrolling,
            startScrollMargins: {
              x: 0,
              y: 0,
              ...t.behaviour?.scrolling?.startScrollMargins
            }
          }
        },
        features: {
          range: true,
          touch: true,
          deselectOnBlur: false,
          ...t.features,
          singleTap: {
            allow: true,
            intersect: "native",
            ...t.features?.singleTap
          }
        }
      };
      for (const i of Object.getOwnPropertyNames(Object.getPrototypeOf(this)))
        typeof this[i] == "function" && (this[i] = this[i].bind(this));
      const { document: n, selectionAreaClass: o, selectionContainerClass: s } = this._options;
      this._area = n.createElement("div"), this._clippingElement = n.createElement("div"), this._clippingElement.appendChild(this._area), this._area.classList.add(o), s && this._clippingElement.classList.add(s), Y(this._area, {
        willChange: "top, left, bottom, right, width, height",
        top: 0,
        left: 0,
        position: "fixed"
      }), Y(this._clippingElement, {
        overflow: "hidden",
        position: "fixed",
        transform: "translate3d(0, 0, 0)",
        // https://stackoverflow.com/a/38268846
        pointerEvents: "none",
        zIndex: "1"
      }), this._frame = zn((i) => {
        this._recalculateSelectionAreaRect(), this._updateElementSelection(), this._emitEvent("move", i), this._redrawSelectionArea();
      }), this.enable();
    }
    _toggleStartEvents(t = true) {
      const { document: n, features: o } = this._options, s = t ? W : $;
      s(n, "mousedown", this._onTapStart), o.touch && s(n, "touchstart", this._onTapStart, { passive: false });
    }
    _onTapStart(t, n = false) {
      const { x: o, y: s, target: i } = ne(t), { document: l, startAreas: c, boundaries: r, features: a, behaviour: d } = this._options, h = i.getBoundingClientRect();
      if (t instanceof MouseEvent && !Un(t, d.triggers))
        return;
      const u = K(c, l), y = K(r, l);
      this._targetElement = y.find((m) => We(m.getBoundingClientRect(), h));
      const b = t.composedPath(), p = u.find((m) => b.includes(m));
      if (this._targetBoundary = y.find((m) => b.includes(m)), !this._targetElement || !p || !this._targetBoundary || !n && this._emitEvent("beforestart", t) === false)
        return;
      this._areaLocation = { x1: o, y1: s, x2: 0, y2: 0 };
      const g = l.scrollingElement ?? l.body;
      this._scrollDelta = { x: g.scrollLeft, y: g.scrollTop }, this._singleClick = true, this.clearSelection(false, true), W(l, ["touchmove", "mousemove"], this._delayedTapMove, { passive: false }), W(l, ["mouseup", "touchcancel", "touchend"], this._onTapStop), W(l, "scroll", this._onScroll), a.deselectOnBlur && (this._targetBoundaryScrolled = false, W(this._targetBoundary, "scroll", this._onStartAreaScroll));
    }
    _onSingleTap(t) {
      const {
        singleTap: { intersect: n },
        range: o
      } = this._options.features, s = ne(t);
      let i;
      if (n === "native")
        i = s.target;
      else if (n === "touch") {
        this.resolveSelectables();
        const { x: c, y: r } = s;
        i = this._selectables.find((a) => {
          const { right: d, left: h, top: u, bottom: y } = a.getBoundingClientRect();
          return c < d && c > h && r < y && r > u;
        });
      }
      if (!i)
        return;
      for (this.resolveSelectables(); !this._selectables.includes(i); )
        if (i.parentElement)
          i = i.parentElement;
        else {
          this._targetBoundaryScrolled || this.clearSelection();
          return;
        }
      const { stored: l } = this._selection;
      if (this._emitEvent("start", t), t.shiftKey && o && this._latestElement) {
        const c = this._latestElement, [r, a] = c.compareDocumentPosition(i) & 4 ? [i, c] : [c, i], d = [
          ...this._selectables.filter((h) => h.compareDocumentPosition(r) & 4 && h.compareDocumentPosition(a) & 2),
          r,
          a
        ];
        this.select(d), this._latestElement = c;
      } else l.includes(i) && (l.length === 1 || t.ctrlKey || l.every((c) => this._selection.stored.includes(c))) ? this.deselect(i) : (this.select(i), this._latestElement = i);
    }
    _delayedTapMove(t) {
      const {
        container: n,
        document: o,
        behaviour: { startThreshold: s }
      } = this._options, { x1: i, y1: l } = this._areaLocation, { x: c, y: r } = ne(t);
      if (
        // Single number for both coordinates
        typeof s == "number" && F(c + r - (i + l)) >= s || // Different x and y threshold
        typeof s == "object" && F(c - i) >= s.x || F(r - l) >= s.y
      ) {
        if ($(o, ["mousemove", "touchmove"], this._delayedTapMove, { passive: false }), this._emitEvent("beforedrag", t) === false) {
          $(o, ["mouseup", "touchcancel", "touchend"], this._onTapStop);
          return;
        }
        W(o, ["mousemove", "touchmove"], this._onTapMove, { passive: false }), Y(this._area, "display", "block"), K(n, o)[0].appendChild(this._clippingElement), this.resolveSelectables(), this._singleClick = false, this._targetRect = this._targetElement.getBoundingClientRect(), this._scrollAvailable = this._targetElement.scrollHeight !== this._targetElement.clientHeight || this._targetElement.scrollWidth !== this._targetElement.clientWidth, this._scrollAvailable && (W(this._targetElement, "wheel", this._wheelScroll, { passive: false }), W(this._options.document, "keydown", this._keyboardScroll, { passive: false }), this._selectables = this._selectables.filter((a) => this._targetElement.contains(a))), this._setupSelectionArea(), this._emitEvent("start", t), this._onTapMove(t);
      }
      this._handleMoveEvent(t);
    }
    _setupSelectionArea() {
      const { _clippingElement: t, _targetElement: n, _area: o } = this, s = this._targetRect = n.getBoundingClientRect();
      this._scrollAvailable ? (Y(t, {
        top: s.top,
        left: s.left,
        width: s.width,
        height: s.height
      }), Y(o, {
        marginTop: -s.top,
        marginLeft: -s.left
      })) : (Y(t, {
        top: 0,
        left: 0,
        width: "100%",
        height: "100%"
      }), Y(o, {
        marginTop: 0,
        marginLeft: 0
      }));
    }
    _onTapMove(t) {
      const { _scrollSpeed: n, _areaLocation: o, _options: s, _frame: i } = this, { speedDivider: l } = s.behaviour.scrolling;
      this._targetElement;
      const { x: c, y: r } = ne(t);
      if (o.x2 = c, o.y2 = r, this._lastMousePosition.x = c, this._lastMousePosition.y = r, this._scrollAvailable && !this._scrollingActive && (n.y || n.x)) {
        this._scrollingActive = true;
        const a = () => {
          if (!n.x && !n.y) {
            this._scrollingActive = false;
            return;
          }
          const d = this._options.mindElixirInstance;
          if (d && d.move) {
            const h = n.x ? Ge(n.x / l) : 0, u = n.y ? Ge(n.y / l) : 0;
            (h || u) && (d.move(-h, -u), o.x1 -= h, o.y1 -= u);
          }
          i.next(t), requestAnimationFrame(a);
        };
        requestAnimationFrame(a);
      } else
        i.next(t);
      this._handleMoveEvent(t);
    }
    _handleMoveEvent(t) {
      const { features: n } = this._options;
      (n.touch && Kn() || this._scrollAvailable && qn()) && t.preventDefault();
    }
    _onScroll() {
      const {
        _scrollDelta: t,
        _options: { document: n }
      } = this, { scrollTop: o, scrollLeft: s } = n.scrollingElement ?? n.body;
      this._areaLocation.x1 += t.x - s, this._areaLocation.y1 += t.y - o, t.x = s, t.y = o, this._setupSelectionArea(), this._frame.next(null);
    }
    _onStartAreaScroll() {
      this._targetBoundaryScrolled = true, $(this._targetElement, "scroll", this._onStartAreaScroll);
    }
    _wheelScroll(t) {
      const { manualSpeed: n } = this._options.behaviour.scrolling, o = t.deltaY ? t.deltaY > 0 ? 1 : -1 : 0, s = t.deltaX ? t.deltaX > 0 ? 1 : -1 : 0;
      this._scrollSpeed.y += o * n, this._scrollSpeed.x += s * n, this._onTapMove(t), t.preventDefault();
    }
    _keyboardScroll(t) {
      const { manualSpeed: n } = this._options.behaviour.scrolling, o = t.key === "ArrowLeft" ? -1 : t.key === "ArrowRight" ? 1 : 0, s = t.key === "ArrowUp" ? -1 : t.key === "ArrowDown" ? 1 : 0;
      this._scrollSpeed.x += Math.sign(o) * n, this._scrollSpeed.y += Math.sign(s) * n, t.preventDefault(), this._onTapMove({
        clientX: this._lastMousePosition.x,
        clientY: this._lastMousePosition.y,
        preventDefault: () => {
        }
      });
    }
    _recalculateSelectionAreaRect() {
      const { _scrollSpeed: t, _areaLocation: n, _targetElement: o, _options: s } = this, i = this._targetRect, { x1: l, y1: c } = n;
      let { x2: r, y2: a } = n;
      const {
        behaviour: {
          scrolling: { startScrollMargins: d }
        }
      } = s;
      r < i.left + d.x ? (t.x = -F(i.left - r + d.x), r = r < i.left ? i.left : r) : r > i.right - d.x ? (t.x = F(i.left + i.width - r - d.x), r = r > i.right ? i.right : r) : t.x = 0, a < i.top + d.y ? (t.y = -F(i.top - a + d.y), a = a < i.top ? i.top : a) : a > i.bottom - d.y ? (t.y = F(i.top + i.height - a - d.y), a = a > i.bottom ? i.bottom : a) : t.y = 0;
      const h = Fe(l, r), u = Fe(c, a), y = Xe(l, r), b = Xe(c, a);
      this._areaRect = Ye(h, u, y - h, b - u);
    }
    _redrawSelectionArea() {
      const { x: t, y: n, width: o, height: s } = this._areaRect, { style: i } = this._area;
      i.left = `${t}px`, i.top = `${n}px`, i.width = `${o}px`, i.height = `${s}px`;
    }
    _onTapStop(t, n) {
      const { document: o, features: s } = this._options, { _singleClick: i } = this;
      $(this._targetElement, "scroll", this._onStartAreaScroll), $(o, ["mousemove", "touchmove"], this._delayedTapMove), $(o, ["touchmove", "mousemove"], this._onTapMove), $(o, ["mouseup", "touchcancel", "touchend"], this._onTapStop), $(o, "scroll", this._onScroll), this._keepSelection(), t && i && s.singleTap.allow ? this._onSingleTap(t) : !i && !n && (this._updateElementSelection(), this._emitEvent("stop", t)), this._scrollSpeed.x = 0, this._scrollSpeed.y = 0, $(this._targetElement, "wheel", this._wheelScroll, { passive: true }), $(this._options.document, "keydown", this._keyboardScroll, { passive: true }), this._clippingElement.remove(), this._frame?.cancel(), Y(this._area, "display", "none");
    }
    _updateElementSelection() {
      const { _selectables: t, _options: n, _selection: o, _areaRect: s } = this, { stored: i, selected: l, touched: c } = o, { intersect: r, overlap: a } = n.behaviour, d = a === "invert", h = [], u = [], y = [];
      for (let p = 0; p < t.length; p++) {
        const g = t[p];
        if (We(s, g.getBoundingClientRect(), r)) {
          if (l.includes(g))
            i.includes(g) && !c.includes(g) && c.push(g);
          else if (d && i.includes(g)) {
            y.push(g);
            continue;
          } else
            u.push(g);
          h.push(g);
        }
      }
      d && u.push(...i.filter((p) => !l.includes(p)));
      const b = a === "keep";
      for (let p = 0; p < l.length; p++) {
        const g = l[p];
        !h.includes(g) && !// Check if the user wants to keep previously selected elements, e.g.,
        // not make them part of the current selection as soon as they're touched.
        (b && i.includes(g)) && y.push(g);
      }
      o.selected = h, o.changed = { added: u, removed: y }, this._latestElement = void 0;
    }
    _emitEvent(t, n) {
      return this.emit(t, {
        event: n,
        store: this._selection,
        selection: this
      });
    }
    _keepSelection() {
      const { _options: t, _selection: n } = this, { selected: o, changed: s, touched: i, stored: l } = n, c = o.filter((r) => !l.includes(r));
      switch (t.behaviour.overlap) {
        case "drop": {
          n.stored = [
            ...c,
            ...l.filter((r) => !i.includes(r))
            // Elements not touched
          ];
          break;
        }
        case "invert": {
          n.stored = [
            ...c,
            ...l.filter((r) => !s.removed.includes(r))
            // Elements not removed from selection
          ];
          break;
        }
        case "keep": {
          n.stored = [
            ...l,
            ...o.filter((r) => !l.includes(r))
            // Newly added
          ];
          break;
        }
      }
    }
    /**
     * Manually triggers the start of a selection
     * @param evt A MouseEvent / TouchEvent-like object
     * @param silent If beforestart should be fired
     */
    trigger(t, n = true) {
      this._onTapStart(t, n);
    }
    /**
     * Can be used if during a selection elements have been added
     * Will update everything that can be selected
     */
    resolveSelectables() {
      this._selectables = K(this._options.selectables, this._options.document);
    }
    /**
     * Same as deselecting, but for all elements currently selected
     * @param includeStored If the store should also get cleared
     * @param quiet If move / stop events should be fired
     */
    clearSelection(t = true, n = false) {
      const { selected: o, stored: s, changed: i } = this._selection;
      i.added = [], i.removed.push(...o, ...t ? s : []), n || (this._emitEvent("move", null), this._emitEvent("stop", null)), this._selection = Ve(t ? [] : s);
    }
    /**
     * @returns {Array} Selected elements
     */
    getSelection() {
      return this._selection.stored;
    }
    /**
     * @returns {HTMLElement} The selection area element
     */
    getSelectionArea() {
      return this._area;
    }
    /**
     * @returns {Element[]} Available selectable elements for current selection
     */
    getSelectables() {
      return this._selectables;
    }
    /**
     * Set the location of the selection area
     * @param location A partial AreaLocation object
     */
    setAreaLocation(t) {
      Object.assign(this._areaLocation, t), this._redrawSelectionArea();
    }
    /**
     * @returns {AreaLocation} The current location of the selection area
     */
    getAreaLocation() {
      return this._areaLocation;
    }
    /**
     * Cancel the current selection process, pass true to fire a stop event after cancel
     * @param keepEvent If a stop event should be fired
     */
    cancel(t = false) {
      this._onTapStop(null, !t);
    }
    /**
     * Unbinds all events and removes the area-element.
     */
    destroy() {
      this.cancel(), this.disable(), this._clippingElement.remove(), super.unbindAllListeners();
    }
    /**
     * Enable selecting elements
     */
    enable = this._toggleStartEvents;
    /**
     * Disable selecting elements
     */
    disable = this._toggleStartEvents.bind(this, false);
    /**
     * Adds elements to the selection
     * @param query CSS Query, can be an array of queries
     * @param quiet If this should not trigger the move event
     */
    select(t, n = false) {
      const { changed: o, selected: s, stored: i } = this._selection, l = K(t, this._options.document).filter((c) => !s.includes(c) && !i.includes(c));
      return i.push(...l), s.push(...l), o.added.push(...l), o.removed = [], this._latestElement = void 0, n || (this._emitEvent("move", null), this._emitEvent("stop", null)), l;
    }
    /**
     * Removes a particular element from the selection
     * @param query CSS Query, can be an array of queries
     * @param quiet If this should not trigger the move event
     */
    deselect(t, n = false) {
      const { selected: o, stored: s, changed: i } = this._selection, l = K(t, this._options.document).filter((c) => o.includes(c) || s.includes(c));
      this._selection.stored = s.filter((c) => !l.includes(c)), this._selection.selected = o.filter((c) => !l.includes(c)), this._selection.changed.added = [], this._selection.changed.removed.push(...l.filter((c) => !i.removed.includes(c))), this._latestElement = void 0, n || (this._emitEvent("move", null), this._emitEvent("stop", null));
    }
  };
  function Zn(e) {
    const t = e.mouseSelectionButton === 2 ? [2] : [0], n = new Jn({
      selectables: [".map-container me-tpc"],
      boundaries: [e.container],
      container: e.selectionContainer,
      mindElixirInstance: e,
      // 传递 MindElixir 实例
      features: {
        // deselectOnBlur: true,
        touch: false
      },
      behaviour: {
        triggers: t,
        // Scroll configuration.
        scrolling: {
          // On scrollable areas the number on px per frame is devided by this amount.
          // Default is 10 to provide a enjoyable scroll experience.
          speedDivider: 10,
          startScrollMargins: { x: 50, y: 50 }
        }
      }
    }).on("beforestart", ({ event: o }) => {
      if (!e.editable || e.spacePressed) return false;
      const s = o.target;
      if (s.id === "input-box" || s.className === "circle" || e.container.querySelector(".context-menu")?.contains(s))
        return false;
      if (!o.ctrlKey && !o.metaKey) {
        if (s.tagName === "ME-TPC" && s.classList.contains("selected"))
          return false;
        e.clearSelection();
      }
      const i = n.getSelectionArea();
      return i.style.background = "#4f90f22d", i.style.border = "1px solid #4f90f2", i.parentElement && (i.parentElement.style.zIndex = "9999"), true;
    }).on(
      "move",
      ({
        store: {
          changed: { added: o, removed: s }
        }
      }) => {
        if (o.length > 0 || s.length > 0, o.length > 0) {
          for (const i of o)
            i.className = "selected";
          e.currentNodes = [...e.currentNodes, ...o], e.bus.fire(
            "selectNodes",
            o.map((i) => i.nodeObj)
          );
        }
        if (s.length > 0) {
          for (const i of s)
            i.classList.remove("selected");
          e.currentNodes = e.currentNodes.filter((i) => !s?.includes(i)), e.bus.fire(
            "unselectNodes",
            s.map((i) => i.nodeObj)
          );
        }
      }
    );
    e.selection = n;
  }
  var Qn = function(e, t = true) {
    this.theme = e;
    const o = {
      ...(e.type === "dark" ? we : ve).cssVar,
      ...e.cssVar
    }, s = Object.keys(o);
    for (let i = 0; i < s.length; i++) {
      const l = s[i];
      this.container.style.setProperty(l, o[l]);
    }
    t && this.refresh();
  };
  var eo = function(e) {
    return {
      dom: e,
      moved: false,
      // differentiate click and move
      pointerdown: false,
      lastX: 0,
      lastY: 0,
      handlePointerMove(t) {
        if (this.pointerdown) {
          this.moved = true;
          const n = t.clientX - this.lastX, o = t.clientY - this.lastY;
          this.lastX = t.clientX, this.lastY = t.clientY, this.cb && this.cb(n, o);
        }
      },
      handlePointerDown(t) {
        t.button === 0 && (this.pointerdown = true, this.lastX = t.clientX, this.lastY = t.clientY, this.dom.setPointerCapture(t.pointerId));
      },
      handleClear(t) {
        this.pointerdown = false, t.pointerId !== void 0 && this.dom.releasePointerCapture(t.pointerId);
      },
      cb: null,
      init(t, n) {
        this.cb = n, this.handleClear = this.handleClear.bind(this), this.handlePointerMove = this.handlePointerMove.bind(this), this.handlePointerDown = this.handlePointerDown.bind(this), this.destroy = Je([
          { dom: t, evt: "pointermove", func: this.handlePointerMove },
          { dom: t, evt: "pointerleave", func: this.handleClear },
          { dom: t, evt: "pointerup", func: this.handleClear },
          { dom: this.dom, evt: "pointerdown", func: this.handlePointerDown }
        ]);
      },
      destroy: null,
      clear() {
        this.moved = false, this.pointerdown = false;
      }
    };
  };
  var ze = {
    create: eo
  };
  var to = "#4dc4ff";
  function dt(e, t, n, o, s, i, l, c) {
    return {
      x: e / 8 + n * 3 / 8 + s * 3 / 8 + l / 8,
      y: t / 8 + o * 3 / 8 + i * 3 / 8 + c / 8
    };
  }
  function no(e, t, n) {
    e && (e.dataset.x = t.toString(), e.dataset.y = n.toString(), fe(e));
  }
  function oe(e, t, n, o, s) {
    D(e, {
      x1: t + "",
      y1: n + "",
      x2: o + "",
      y2: s + ""
    });
  }
  function Ke(e, t, n, o, s, i, l, c, r, a) {
    const d = `M ${t} ${n} C ${o} ${s} ${i} ${l} ${c} ${r}`;
    if (e.line.setAttribute("d", d), a.style) {
      const p = a.style;
      p.stroke && e.line.setAttribute("stroke", p.stroke), p.strokeWidth && e.line.setAttribute("stroke-width", String(p.strokeWidth)), p.strokeDasharray && e.line.setAttribute("stroke-dasharray", p.strokeDasharray), p.strokeLinecap && e.line.setAttribute("stroke-linecap", p.strokeLinecap), p.opacity !== void 0 && e.line.setAttribute("opacity", String(p.opacity));
    }
    const h = e.querySelectorAll('path[stroke="transparent"]');
    h.length > 0 && h[0].setAttribute("d", d);
    const u = ce(i, l, c, r);
    if (u) {
      const p = `M ${u.x1} ${u.y1} L ${c} ${r} L ${u.x2} ${u.y2}`;
      if (e.arrow1.setAttribute("d", p), h.length > 1 && h[1].setAttribute("d", p), a.style) {
        const g = a.style;
        g.stroke && e.arrow1.setAttribute("stroke", g.stroke), g.strokeWidth && e.arrow1.setAttribute("stroke-width", String(g.strokeWidth)), g.strokeLinecap && e.arrow1.setAttribute("stroke-linecap", g.strokeLinecap), g.opacity !== void 0 && e.arrow1.setAttribute("opacity", String(g.opacity));
      }
    }
    if (a.bidirectional) {
      const p = ce(o, s, t, n);
      if (p) {
        const g = `M ${p.x1} ${p.y1} L ${t} ${n} L ${p.x2} ${p.y2}`;
        if (e.arrow2.setAttribute("d", g), h.length > 2 && h[2].setAttribute("d", g), a.style) {
          const m = a.style;
          m.stroke && e.arrow2.setAttribute("stroke", m.stroke), m.strokeWidth && e.arrow2.setAttribute("stroke-width", String(m.strokeWidth)), m.strokeLinecap && e.arrow2.setAttribute("stroke-linecap", m.strokeLinecap), m.opacity !== void 0 && e.arrow2.setAttribute("opacity", String(m.opacity));
        }
      }
    }
    const { x: y, y: b } = dt(t, n, o, s, i, l, c, r);
    if (e.labelEl && no(e.labelEl, y, b), a.style?.labelColor) {
      const p = e.labelEl;
      p && (p.style.color = a.style.labelColor);
    }
    fo(e);
  }
  function de(e, t, n) {
    const { offsetLeft: o, offsetTop: s } = H(e.nodes, t), i = t.offsetWidth, l = t.offsetHeight, c = o + i / 2, r = s + l / 2, a = c + n.x, d = r + n.y;
    return {
      w: i,
      h: l,
      cx: c,
      cy: r,
      ctrlX: a,
      ctrlY: d
    };
  }
  function q(e) {
    let t, n;
    const o = (e.cy - e.ctrlY) / (e.ctrlX - e.cx);
    return o > e.h / e.w || o < -e.h / e.w ? e.cy - e.ctrlY < 0 ? (t = e.cx - e.h / 2 / o, n = e.cy + e.h / 2) : (t = e.cx + e.h / 2 / o, n = e.cy - e.h / 2) : e.cx - e.ctrlX < 0 ? (t = e.cx + e.w / 2, n = e.cy - e.w * o / 2) : (t = e.cx - e.w / 2, n = e.cy + e.w * o / 2), {
      x: t,
      y: n
    };
  }
  var oo = function(e, t, n) {
    const o = H(e.nodes, t), s = H(e.nodes, n), i = o.offsetLeft + t.offsetWidth / 2, l = o.offsetTop + t.offsetHeight / 2, c = s.offsetLeft + n.offsetWidth / 2, r = s.offsetTop + n.offsetHeight / 2, a = c - i, d = r - l, h = Math.sqrt(a * a + d * d), u = Math.max(50, Math.min(200, h * 0.3)), y = Math.abs(a), b = Math.abs(d);
    let p, g;
    if (h < 150) {
      const v = t.closest("me-main").className === "lhs" ? -1 : 1;
      p = { x: 200 * v, y: 0 }, g = { x: 200 * v, y: 0 };
    } else if (y > b * 1.5) {
      const v = a > 0 ? t.offsetWidth / 2 : -t.offsetWidth / 2, E = a > 0 ? -n.offsetWidth / 2 : n.offsetWidth / 2;
      p = { x: v + (a > 0 ? u : -u), y: 0 }, g = { x: E + (a > 0 ? -u : u), y: 0 };
    } else if (b > y * 1.5) {
      const v = d > 0 ? t.offsetHeight / 2 : -t.offsetHeight / 2, E = d > 0 ? -n.offsetHeight / 2 : n.offsetHeight / 2;
      p = { x: 0, y: v + (d > 0 ? u : -u) }, g = { x: 0, y: E + (d > 0 ? -u : u) };
    } else {
      const v = Math.atan2(d, a), E = t.offsetWidth / 2 * Math.cos(v), k = t.offsetHeight / 2 * Math.sin(v), _ = -(n.offsetWidth / 2) * Math.cos(v), C = -(n.offsetHeight / 2) * Math.sin(v), x = u * 0.7 * (a > 0 ? 1 : -1), N = u * 0.7 * (d > 0 ? 1 : -1);
      p = { x: E + x, y: k + N }, g = { x: _ - x, y: C - N };
    }
    return { delta1: p, delta2: g };
  };
  var Ae = function(e, t, n, o, s) {
    if (!t || !n)
      return;
    if (!o.delta1 || !o.delta2) {
      const S = oo(e, t, n);
      o.delta1 = S.delta1, o.delta2 = S.delta2;
    }
    const i = de(e, t, o.delta1), l = de(e, n, o.delta2), { x: c, y: r } = q(i), { ctrlX: a, ctrlY: d } = i, { ctrlX: h, ctrlY: u } = l, { x: y, y: b } = q(l), p = ce(h, u, y, b);
    if (!p) return;
    const g = `M ${p.x1} ${p.y1} L ${y} ${b} L ${p.x2} ${p.y2}`;
    let m = "";
    if (o.bidirectional) {
      const S = ce(a, d, c, r);
      if (!S) return;
      m = `M ${S.x1} ${S.y1} L ${c} ${r} L ${S.x2} ${S.y2}`;
    }
    const v = Ln(`M ${c} ${r} C ${a} ${d} ${h} ${u} ${y} ${b}`, g, m, o.style), { x: E, y: k } = dt(c, r, a, d, h, u, y, b), _ = o.style?.labelColor || "rgb(235, 95, 82)", C = "arrow-" + o.id;
    v.id = C;
    const x = e.markdown ? e.markdown(o.label, o) : o.label, N = ye(x, E, k, {
      anchor: "middle",
      color: _,
      dataType: "arrow",
      svgId: C
    });
    v.labelEl = N, v.arrowObj = o, v.dataset.linkid = o.id, e.labelContainer.appendChild(N), e.linkSvgGroup.appendChild(v), fe(N), s || (e.arrows.push(o), e.currentArrow = v, ht(e, o, i, l));
  };
  var so = function(e, t, n = {}) {
    const o = {
      id: z(),
      label: "Custom Link",
      from: e.nodeObj.id,
      to: t.nodeObj.id,
      ...n
    };
    Ae(this, e, t, o), this.bus.fire("operation", {
      name: "createArrow",
      obj: o
    });
  };
  var io = function(e) {
    ue(this);
    const t = { ...e, id: z() };
    Ae(this, this.findEle(t.from), this.findEle(t.to), t), this.bus.fire("operation", {
      name: "createArrow",
      obj: t
    });
  };
  var ro = function(e) {
    let t;
    if (e ? t = e : t = this.currentArrow, !t) return;
    ue(this);
    const n = t.arrowObj.id;
    this.arrows = this.arrows.filter((o) => o.id !== n), t.labelEl?.remove(), t.remove(), this.bus.fire("operation", {
      name: "removeArrow",
      obj: {
        id: n
      }
    });
  };
  var lo = function(e) {
    this.currentArrow = e;
    const t = e.arrowObj, n = this.findEle(t.from), o = this.findEle(t.to), s = de(this, n, t.delta1), i = de(this, o, t.delta2);
    ht(this, t, s, i);
  };
  var co = function() {
    ue(this), this.currentArrow = null;
  };
  var ge = function(e, t) {
    const n = document.createElementNS(j, "path");
    return D(n, {
      d: e,
      stroke: t,
      fill: "none",
      "stroke-width": "6",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    }), n;
  };
  var ao = function(e, t) {
    const n = document.createElementNS(j, "g");
    n.setAttribute("class", "arrow-highlight"), n.setAttribute("opacity", "0.45");
    const o = ge(e.line.getAttribute("d"), t);
    n.appendChild(o);
    const s = ge(e.arrow1.getAttribute("d"), t);
    if (n.appendChild(s), e.arrow2.getAttribute("d")) {
      const i = ge(e.arrow2.getAttribute("d"), t);
      n.appendChild(i);
    }
    e.insertBefore(n, e.firstChild);
  };
  var ho = function(e) {
    const t = e.querySelector(".arrow-highlight");
    t && t.remove();
  };
  var fo = function(e) {
    const t = e.querySelector(".arrow-highlight");
    if (!t) return;
    const n = t.querySelectorAll("path");
    n.length >= 1 && n[0].setAttribute("d", e.line.getAttribute("d")), n.length >= 2 && n[1].setAttribute("d", e.arrow1.getAttribute("d")), n.length >= 3 && e.arrow2.getAttribute("d") && n[2].setAttribute("d", e.arrow2.getAttribute("d"));
  };
  var ue = function(e) {
    e.helper1?.destroy(), e.helper2?.destroy(), e.linkController.style.display = "none", e.P2.style.display = "none", e.P3.style.display = "none", e.currentArrow && ho(e.currentArrow);
  };
  var ht = function(e, t, n, o) {
    const { linkController: s, P2: i, P3: l, line1: c, line2: r, nodes: a, map: d, currentArrow: h, bus: u } = e;
    if (!h) return;
    s.style.display = "initial", i.style.display = "initial", l.style.display = "initial", a.appendChild(s), a.appendChild(i), a.appendChild(l), ao(h, to);
    let { x: y, y: b } = q(n), { ctrlX: p, ctrlY: g } = n, { ctrlX: m, ctrlY: v } = o, { x: E, y: k } = q(o);
    i.style.cssText = `top:${g}px;left:${p}px;`, l.style.cssText = `top:${v}px;left:${m}px;`, oe(c, y, b, p, g), oe(r, m, v, E, k), e.helper1 = ze.create(i), e.helper2 = ze.create(l), e.helper1.init(d, (_, C) => {
      p = p + _ / e.scaleVal, g = g + C / e.scaleVal;
      const x = q({ ...n, ctrlX: p, ctrlY: g });
      y = x.x, b = x.y, i.style.top = g + "px", i.style.left = p + "px", Ke(h, y, b, p, g, m, v, E, k, t), oe(c, y, b, p, g), t.delta1.x = p - n.cx, t.delta1.y = g - n.cy, u.fire("updateArrowDelta", t);
    }), e.helper2.init(d, (_, C) => {
      m = m + _ / e.scaleVal, v = v + C / e.scaleVal;
      const x = q({ ...o, ctrlX: m, ctrlY: v });
      E = x.x, k = x.y, l.style.top = v + "px", l.style.left = m + "px", Ke(h, y, b, p, g, m, v, E, k, t), oe(r, m, v, E, k), t.delta2.x = m - o.cx, t.delta2.y = v - o.cy, u.fire("updateArrowDelta", t);
    });
  };
  function uo() {
    this.linkSvgGroup.innerHTML = "", this.labelContainer.querySelectorAll('.svg-label[data-type="arrow"]').forEach((t) => t.remove());
    for (let t = 0; t < this.arrows.length; t++) {
      const n = this.arrows[t];
      try {
        Ae(this, this.findEle(n.from), this.findEle(n.to), n, true);
      } catch {
      }
    }
    this.nodes.appendChild(this.linkSvgGroup);
  }
  function po(e) {
    ue(this), e && e.labelEl && lt(this, e.labelEl, e.arrowObj);
  }
  function go() {
    this.arrows = this.arrows.filter((e) => le(e.from, this.nodeData) && le(e.to, this.nodeData));
  }
  var mo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    createArrow: so,
    createArrowFrom: io,
    editArrowLabel: po,
    removeArrow: ro,
    renderArrow: uo,
    selectArrow: lo,
    tidyArrow: go,
    unselectArrow: co
  }, Symbol.toStringTag, { value: "Module" }));
  var yo = function(e) {
    if (e.length === 0) throw new Error("No selected node.");
    if (e.length === 1) {
      const r = e[0].nodeObj, a = e[0].nodeObj.parent;
      if (!a) throw new Error("Can not select root node.");
      const d = a.children.findIndex((h) => r === h);
      return {
        parent: a.id,
        start: d,
        end: d
      };
    }
    let t = 0;
    const n = e.map((r) => {
      let a = r.nodeObj;
      const d = [];
      for (; a.parent; ) {
        const h = a.parent, y = h.children?.indexOf(a);
        a = h, d.unshift({ node: a, index: y });
      }
      return d.length > t && (t = d.length), d;
    });
    let o = 0;
    e: for (; o < t; o++) {
      const r = n[0][o]?.node;
      for (let a = 1; a < n.length; a++)
        if (n[a][o]?.node !== r)
          break e;
    }
    if (!o) throw new Error("Can not select root node.");
    const s = n.map((r) => r[o - 1].index).sort(), i = s[0] || 0, l = s[s.length - 1] || 0, c = n[0][o - 1].node;
    if (!c.parent) throw new Error("Please select nodes in the same main topic.");
    return {
      parent: c.id,
      start: i,
      end: l
    };
  };
  var bo = function(e) {
    const t = document.createElementNS(j, "g");
    return t.setAttribute("id", e), t;
  };
  var qe = function(e, t) {
    const n = document.createElementNS(j, "path");
    return D(n, {
      d: e,
      stroke: t || "#666",
      fill: "none",
      "stroke-linecap": "round",
      "stroke-width": "2"
    }), n;
  };
  var vo = (e) => e.parentElement.parentElement;
  var wo = function(e, { parent: t, start: n }) {
    const o = e.findEle(t), s = o.nodeObj;
    let i;
    return s.parent ? i = o.closest("me-main").className : i = e.findEle(s.children[n].id).closest("me-main").className, i;
  };
  var Me = function(e, t) {
    const { id: n, label: o, parent: s, start: i, end: l, style: c } = t, { nodes: r, theme: a, summarySvg: d } = e, u = e.findEle(s).nodeObj, y = wo(e, t);
    let b = 1 / 0, p = 0, g = 0, m = 0;
    for (let f = i; f <= l; f++) {
      const w = u.children?.[f];
      if (!w)
        return e.removeSummary(n), null;
      const T = vo(e.findEle(w.id)), { offsetLeft: O, offsetTop: X } = H(r, T), M = i === l ? 10 : 20;
      f === i && (g = X + M), f === l && (m = X + T.offsetHeight - M), O < b && (b = O), T.offsetWidth + O > p && (p = T.offsetWidth + O);
    }
    let v, E;
    const k = u.parent ? 10 : 0, _ = g + k, C = m + k, x = (_ + C) / 2, N = c?.stroke || a.cssVar["--color"], S = c?.labelColor || a.cssVar["--color"], A = "s-" + n, L = e.markdown ? e.markdown(o, t) : o;
    y === B.LHS ? (v = qe(`M ${b + 10} ${_} c -5 0 -10 5 -10 10 L ${b} ${C - 10} c 0 5 5 10 10 10 M ${b} ${x} h -10`, N), E = ye(L, b - 20, x, { anchor: "end", color: S, dataType: "summary", svgId: A })) : (v = qe(`M ${p - 10} ${_} c 5 0 10 5 10 10 L ${p} ${C - 10} c 0 5 -5 10 -10 10 M ${p} ${x} h 10`, N), E = ye(L, p + 20, x, { anchor: "start", color: S, dataType: "summary", svgId: A }));
    const R = bo(A);
    return R.appendChild(v), e.labelContainer.appendChild(E), fe(E), R.summaryObj = t, R.labelEl = E, d.appendChild(R), R;
  };
  var xo = function(e = {}) {
    if (!this.currentNodes) return;
    const { currentNodes: t, summaries: n, bus: o } = this, { parent: s, start: i, end: l } = yo(t), c = { id: z(), parent: s, start: i, end: l, label: "summary", style: e.style }, r = Me(this, c);
    n.push(c), this.editSummary(r), o.fire("operation", {
      name: "createSummary",
      obj: c
    });
  };
  var Eo = function(e) {
    const t = z(), n = { ...e, id: t };
    Me(this, n), this.summaries.push(n), this.bus.fire("operation", {
      name: "createSummary",
      obj: n
    });
  };
  var Co = function(e) {
    const t = this.summaries.findIndex((n) => n.id === e);
    t > -1 && (this.summaries.splice(t, 1), this.nodes.querySelector("#s-" + e)?.remove(), this.nodes.querySelector("#label-s-" + e)?.remove()), this.bus.fire("operation", {
      name: "removeSummary",
      obj: { id: e }
    });
  };
  var So = function(e) {
    const t = e.labelEl;
    t && t.classList.add("selected"), this.currentSummary = e;
  };
  var No = function() {
    this.currentSummary?.labelEl?.classList.remove("selected"), this.currentSummary = null;
  };
  var To = function() {
    this.summarySvg.innerHTML = "", this.summaries.forEach((e) => {
      try {
        Me(this, e);
      } catch {
      }
    }), this.nodes.insertAdjacentElement("beforeend", this.summarySvg);
  };
  var _o = function(e) {
    e && e.labelEl && lt(this, e.labelEl, e.summaryObj);
  };
  var ko = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    createSummary: xo,
    createSummaryFrom: Eo,
    editSummary: _o,
    removeSummary: Co,
    renderSummary: To,
    selectSummary: So,
    unselectSummary: No
  }, Symbol.toStringTag, { value: "Module" }));
  var P = "http://www.w3.org/2000/svg";
  function Lo(e, t) {
    const n = document.createElementNS(P, "svg");
    return D(n, {
      version: "1.1",
      xmlns: P,
      height: e,
      width: t
    }), n;
  }
  function Do(e, t) {
    return (parseInt(e) - parseInt(t)) / 2;
  }
  function Ao(e, t, n, o) {
    const s = document.createElementNS(P, "g");
    let i = "";
    return e.text ? i = e.text.textContent : i = e.childNodes[0].textContent, i.split(`
`).forEach((c, r) => {
      const a = document.createElementNS(P, "text");
      D(a, {
        x: n + parseInt(t.paddingLeft) + "",
        y: o + parseInt(t.paddingTop) + Do(t.lineHeight, t.fontSize) * (r + 1) + parseFloat(t.fontSize) * (r + 1) + "",
        "text-anchor": "start",
        "font-family": t.fontFamily,
        "font-size": `${t.fontSize}`,
        "font-weight": `${t.fontWeight}`,
        fill: `${t.color}`
      }), a.innerHTML = c, s.appendChild(a);
    }), s;
  }
  function Mo(e, t, n, o) {
    let s = "";
    e.nodeObj?.dangerouslySetInnerHTML ? s = e.nodeObj.dangerouslySetInnerHTML : e.text ? s = e.text.textContent : s = e.childNodes[0].textContent;
    const i = document.createElementNS(P, "foreignObject");
    D(i, {
      x: n + parseInt(t.paddingLeft) + "",
      y: o + parseInt(t.paddingTop) + "",
      width: t.width,
      height: t.height
    });
    const l = document.createElement("div");
    return D(l, {
      xmlns: "http://www.w3.org/1999/xhtml",
      style: `font-family: ${t.fontFamily}; font-size: ${t.fontSize}; font-weight: ${t.fontWeight}; color: ${t.color}; white-space: pre-wrap;`
    }), l.innerHTML = s, i.appendChild(l), i;
  }
  function Po(e, t) {
    const n = getComputedStyle(t), { offsetLeft: o, offsetTop: s } = H(e.nodes, t), i = document.createElementNS(P, "rect");
    return D(i, {
      x: o + "",
      y: s + "",
      rx: n.borderRadius,
      ry: n.borderRadius,
      width: n.width,
      height: n.height,
      fill: n.backgroundColor,
      stroke: n.borderColor,
      "stroke-width": n.borderWidth
    }), i;
  }
  function se(e, t, n = false) {
    const o = getComputedStyle(t), { offsetLeft: s, offsetTop: i } = H(e.nodes, t), l = document.createElementNS(P, "rect");
    D(l, {
      x: s + "",
      y: i + "",
      rx: o.borderRadius,
      ry: o.borderRadius,
      width: o.width,
      height: o.height,
      fill: o.backgroundColor,
      stroke: o.borderColor,
      "stroke-width": o.borderWidth
    });
    const c = document.createElementNS(P, "g");
    c.appendChild(l);
    let r;
    return n ? r = Mo(t, o, s, i) : r = Ao(t, o, s, i), c.appendChild(r), c;
  }
  function Oo(e, t) {
    const n = getComputedStyle(t), { offsetLeft: o, offsetTop: s } = H(e.nodes, t), i = document.createElementNS(P, "a"), l = document.createElementNS(P, "text");
    return D(l, {
      x: o + "",
      y: s + parseInt(n.fontSize) + "",
      "text-anchor": "start",
      "font-family": n.fontFamily,
      "font-size": `${n.fontSize}`,
      "font-weight": `${n.fontWeight}`,
      fill: `${n.color}`
    }), l.innerHTML = t.textContent, i.appendChild(l), i.setAttribute("href", t.href), i;
  }
  function $o(e, t) {
    const n = getComputedStyle(t), { offsetLeft: o, offsetTop: s } = H(e.nodes, t), i = document.createElementNS(P, "image");
    return D(i, {
      x: o + "",
      y: s + "",
      width: n.width + "",
      height: n.height + "",
      href: t.src
    }), i;
  }
  var ie = 100;
  var Ho = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
  var jo = (e, t = false) => {
    const n = e.nodes, o = n.offsetHeight + ie * 2, s = n.offsetWidth + ie * 2, i = Lo(o + "px", s + "px"), l = document.createElementNS(P, "svg"), c = document.createElementNS(P, "rect");
    D(c, {
      x: "0",
      y: "0",
      width: `${s}`,
      height: `${o}`,
      fill: e.theme.cssVar["--bgcolor"]
    }), i.appendChild(c), n.querySelectorAll(".subLines").forEach((h) => {
      const u = h.cloneNode(true), { offsetLeft: y, offsetTop: b } = H(n, h.parentElement);
      u.setAttribute("x", `${y}`), u.setAttribute("y", `${b}`), l.appendChild(u);
    });
    const r = n.querySelector(".lines")?.cloneNode(true);
    r && l.appendChild(r);
    const a = n.querySelector(".topiclinks")?.cloneNode(true);
    a && l.appendChild(a);
    const d = n.querySelector(".summary")?.cloneNode(true);
    return d && l.appendChild(d), n.querySelectorAll("me-tpc").forEach((h) => {
      h.nodeObj.dangerouslySetInnerHTML ? l.appendChild(se(e, h, !t)) : (l.appendChild(Po(e, h)), l.appendChild(se(e, h.text, !t)));
    }), n.querySelectorAll(".tags > span").forEach((h) => {
      l.appendChild(se(e, h));
    }), n.querySelectorAll(".icons > span").forEach((h) => {
      l.appendChild(se(e, h));
    }), n.querySelectorAll(".hyper-link").forEach((h) => {
      l.appendChild(Oo(e, h));
    }), n.querySelectorAll("img").forEach((h) => {
      l.appendChild($o(e, h));
    }), D(l, {
      x: ie + "",
      y: ie + "",
      overflow: "visible"
    }), i.appendChild(l), i;
  };
  var Io = (e, t) => (t && e.insertAdjacentHTML("afterbegin", "<style>" + t + "</style>"), Ho + e.outerHTML);
  function Ro(e) {
    return new Promise((t, n) => {
      const o = new FileReader();
      o.onload = (s) => {
        t(s.target.result);
      }, o.onerror = (s) => {
        n(s);
      }, o.readAsDataURL(e);
    });
  }
  var Bo = function(e = false, t) {
    const n = jo(this, e), o = Io(n, t);
    return new Blob([o], { type: "image/svg+xml" });
  };
  var Yo = async function(e = false, t) {
    const n = this.exportSvg(e, t), o = await Ro(n);
    return new Promise((s, i) => {
      const l = new Image();
      l.setAttribute("crossOrigin", "anonymous"), l.onload = () => {
        const c = document.createElement("canvas");
        c.width = l.width, c.height = l.height, c.getContext("2d").drawImage(l, 0, 0), c.toBlob(s, "image/png", 1);
      }, l.src = o, l.onerror = i;
    });
  };
  var Wo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    exportPng: Yo,
    exportSvg: Bo
  }, Symbol.toStringTag, { value: "Module" }));
  function Xo(e, t) {
    return async function(...n) {
      const o = this.before[t];
      o && !await o.apply(this, n) || e.apply(this, n);
    };
  }
  var Ue = Object.keys(ot);
  var ft = {};
  for (let e = 0; e < Ue.length; e++) {
    const t = Ue[e];
    ft[t] = Xo(ot[t], t);
  }
  var Fo = {
    getObjById: le,
    generateNewObj: ut,
    layout: pt,
    linkDiv: Dn,
    editTopic: xt,
    createWrapper: yt,
    createParent: bt,
    createChildren: vt,
    createTopic: wt,
    findEle: Ze,
    changeTheme: Qn,
    ...un,
    ...ft,
    ...mo,
    ...ko,
    ...Wo,
    init(e) {
      if (e = JSON.parse(JSON.stringify(e)), !e || !e.nodeData) return new Error("MindElixir: `data` is required");
      e.direction !== void 0 && (this.direction = e.direction), this.changeTheme(e.theme || this.theme, false), this.nodeData = e.nodeData, V(this.nodeData), this.arrows = e.arrows || [], this.summaries = e.summaries || [], this.tidyArrow(), this.toolBar && Gn(this), this.keypress && bn(this, this.keypress), Zn(this), this.disposable.push(Tn()), this.contextMenu && this.disposable.push(Mn(this, this.contextMenu)), this.allowUndo && this.disposable.push(On(this)), this.layout(), this.linkDiv(), this.toCenter();
    },
    destroy() {
      this.disposable.forEach((e) => e()), this.el && (this.el.innerHTML = ""), this.el = void 0, this.nodeData = void 0, this.arrows = void 0, this.summaries = void 0, this.currentArrow = void 0, this.currentNodes = void 0, this.currentSummary = void 0, this.theme = void 0, this.direction = void 0, this.bus = void 0, this.container = void 0, this.map = void 0, this.lines = void 0, this.linkController = void 0, this.linkSvgGroup = void 0, this.P2 = void 0, this.P3 = void 0, this.line1 = void 0, this.line2 = void 0, this.nodes = void 0, this.selection?.destroy(), this.selection = void 0;
    }
  };
  function Go({ pT: e, pL: t, pW: n, pH: o, cT: s, cL: i, cW: l, cH: c, direction: r, containerHeight: a }) {
    let d = t + n / 2;
    const h = e + o / 2;
    let u;
    r === B.LHS ? u = i + l : u = i;
    const y = s + c / 2, p = (1 - Math.abs(y - h) / a) * 0.25 * (n / 2);
    return r === B.LHS ? d = d - n / 10 - p : d = d + n / 10 + p, `M ${d} ${h} Q ${d} ${y} ${u} ${y}`;
  }
  function Vo({ pT: e, pL: t, pW: n, pH: o, cT: s, cL: i, cW: l, cH: c, direction: r, isFirst: a }) {
    const d = parseInt(this.container.style.getPropertyValue("--node-gap-x"));
    let h = 0, u = 0;
    a ? h = e + o / 2 : h = e + o;
    const y = s + c;
    let b = 0, p = 0, g = 0;
    const m = Math.abs(h - y) / 300 * d;
    return r === B.LHS ? (g = t, b = g + d, p = g - d, u = i + d, `M ${b} ${h} C ${g} ${h} ${g + m} ${y} ${p} ${y} H ${u}`) : (g = t + n, b = g - d, p = g + d, u = i + l - d, `M ${b} ${h} C ${g} ${h} ${g - m} ${y} ${p} ${y} H ${u}`);
  }
  var zo = "5.10.0";
  function Ko(e) {
    return {
      x: 0,
      y: 0,
      moved: false,
      // diffrentiate click and move
      mousedown: false,
      onMove(t, n) {
        this.mousedown && (this.moved = true, e.move(t, n));
      },
      clear() {
        this.mousedown = false;
      }
    };
  }
  function I({
    el: e,
    direction: t,
    editable: n,
    contextMenu: o,
    toolBar: s,
    keypress: i,
    mouseSelectionButton: l,
    selectionContainer: c,
    before: r,
    newTopicName: a,
    allowUndo: d,
    generateMainBranch: h,
    generateSubBranch: u,
    overflowHidden: y,
    theme: b,
    alignment: p,
    scaleSensitivity: g,
    scaleMax: m,
    scaleMin: v,
    handleWheel: E,
    markdown: k,
    imageProxy: _,
    pasteHandler: C
  }) {
    let x = null;
    const N = Object.prototype.toString.call(e);
    if (N === "[object HTMLDivElement]" ? x = e : N === "[object String]" && (x = document.querySelector(e)), !x) throw new Error("MindElixir: el is not a valid element");
    x.style.position = "relative", x.innerHTML = "", this.el = x, this.disposable = [], this.before = r || {}, this.newTopicName = a || "New Node", this.contextMenu = o ?? true, this.toolBar = s ?? true, this.keypress = i ?? true, this.mouseSelectionButton = l ?? 0, this.direction = t ?? 1, this.editable = n ?? true, this.allowUndo = d ?? true, this.scaleSensitivity = g ?? 0.1, this.scaleMax = m ?? 1.4, this.scaleMin = v ?? 0.2, this.generateMainBranch = h || Go, this.generateSubBranch = u || Vo, this.overflowHidden = y ?? false, this.alignment = p ?? "root", this.handleWheel = E ?? true, this.markdown = k || void 0, this.imageProxy = _ || void 0, this.currentNodes = [], this.currentArrow = null, this.scaleVal = 1, this.tempDirection = null, this.dragMoveHelper = Ko(this), this.bus = kn(), this.container = document.createElement("div"), this.selectionContainer = c || this.container, this.container.className = "map-container";
    const S = window.matchMedia("(prefers-color-scheme: dark)");
    this.theme = b || (S.matches ? we : ve);
    const A = document.createElement("div");
    A.className = "map-canvas", this.map = A, this.container.setAttribute("tabindex", "0"), this.container.appendChild(this.map), this.el.appendChild(this.container), this.nodes = document.createElement("me-nodes"), this.lines = Q("lines"), this.summarySvg = Q("summary"), this.linkController = Q("linkcontroller"), this.P2 = document.createElement("div"), this.P3 = document.createElement("div"), this.P2.className = this.P3.className = "circle", this.P2.style.display = this.P3.style.display = "none", this.line1 = Re(), this.line2 = Re(), this.linkController.appendChild(this.line1), this.linkController.appendChild(this.line2), this.linkSvgGroup = Q("topiclinks"), this.labelContainer = document.createElement("div"), this.labelContainer.className = "label-container", this.map.appendChild(this.nodes), this.overflowHidden ? this.container.style.overflow = "hidden" : this.disposable.push(_n(this)), C && (this.pasteHandler = C);
  }
  I.prototype = Fo;
  Object.defineProperty(I.prototype, "currentNode", {
    get() {
      return this.currentNodes[this.currentNodes.length - 1];
    },
    enumerable: true
  });
  I.LEFT = 0;
  I.RIGHT = 1;
  I.SIDE = 2;
  I.THEME = ve;
  I.DARK_THEME = we;
  I.version = zo;
  I.E = Ze;
  I.new = (e) => ({
    nodeData: {
      id: z(),
      topic: e || "new topic",
      children: []
    }
  });

  // node_modules/highlight.js/es/core.js
  var import_core = __toESM(require_core(), 1);
  var core_default = import_core.default;

  // node_modules/highlight.js/es/languages/javascript.js
  var IDENT_RE = "[A-Za-z$_][0-9A-Za-z$_]*";
  var KEYWORDS = [
    "as",
    // for exports
    "in",
    "of",
    "if",
    "for",
    "while",
    "finally",
    "var",
    "new",
    "function",
    "do",
    "return",
    "void",
    "else",
    "break",
    "catch",
    "instanceof",
    "with",
    "throw",
    "case",
    "default",
    "try",
    "switch",
    "continue",
    "typeof",
    "delete",
    "let",
    "yield",
    "const",
    "class",
    // JS handles these with a special rule
    // "get",
    // "set",
    "debugger",
    "async",
    "await",
    "static",
    "import",
    "from",
    "export",
    "extends",
    // It's reached stage 3, which is "recommended for implementation":
    "using"
  ];
  var LITERALS = [
    "true",
    "false",
    "null",
    "undefined",
    "NaN",
    "Infinity"
  ];
  var TYPES = [
    // Fundamental objects
    "Object",
    "Function",
    "Boolean",
    "Symbol",
    // numbers and dates
    "Math",
    "Date",
    "Number",
    "BigInt",
    // text
    "String",
    "RegExp",
    // Indexed collections
    "Array",
    "Float32Array",
    "Float64Array",
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Int32Array",
    "Uint16Array",
    "Uint32Array",
    "BigInt64Array",
    "BigUint64Array",
    // Keyed collections
    "Set",
    "Map",
    "WeakSet",
    "WeakMap",
    // Structured data
    "ArrayBuffer",
    "SharedArrayBuffer",
    "Atomics",
    "DataView",
    "JSON",
    // Control abstraction objects
    "Promise",
    "Generator",
    "GeneratorFunction",
    "AsyncFunction",
    // Reflection
    "Reflect",
    "Proxy",
    // Internationalization
    "Intl",
    // WebAssembly
    "WebAssembly"
  ];
  var ERROR_TYPES = [
    "Error",
    "EvalError",
    "InternalError",
    "RangeError",
    "ReferenceError",
    "SyntaxError",
    "TypeError",
    "URIError"
  ];
  var BUILT_IN_GLOBALS = [
    "setInterval",
    "setTimeout",
    "clearInterval",
    "clearTimeout",
    "require",
    "exports",
    "eval",
    "isFinite",
    "isNaN",
    "parseFloat",
    "parseInt",
    "decodeURI",
    "decodeURIComponent",
    "encodeURI",
    "encodeURIComponent",
    "escape",
    "unescape"
  ];
  var BUILT_IN_VARIABLES = [
    "arguments",
    "this",
    "super",
    "console",
    "window",
    "document",
    "localStorage",
    "sessionStorage",
    "module",
    "global"
    // Node.js
  ];
  var BUILT_INS = [].concat(
    BUILT_IN_GLOBALS,
    TYPES,
    ERROR_TYPES
  );
  function javascript(hljs) {
    const regex = hljs.regex;
    const hasClosingTag = (match, { after }) => {
      const tag = "</" + match[0].slice(1);
      const pos = match.input.indexOf(tag, after);
      return pos !== -1;
    };
    const IDENT_RE$1 = IDENT_RE;
    const FRAGMENT = {
      begin: "<>",
      end: "</>"
    };
    const XML_SELF_CLOSING = /<[A-Za-z0-9\\._:-]+\s*\/>/;
    const XML_TAG = {
      begin: /<[A-Za-z0-9\\._:-]+/,
      end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
      /**
       * @param {RegExpMatchArray} match
       * @param {CallbackResponse} response
       */
      isTrulyOpeningTag: (match, response) => {
        const afterMatchIndex = match[0].length + match.index;
        const nextChar = match.input[afterMatchIndex];
        if (
          // HTML should not include another raw `<` inside a tag
          // nested type?
          // `<Array<Array<number>>`, etc.
          nextChar === "<" || // the , gives away that this is not HTML
          // `<T, A extends keyof T, V>`
          nextChar === ","
        ) {
          response.ignoreMatch();
          return;
        }
        if (nextChar === ">") {
          if (!hasClosingTag(match, { after: afterMatchIndex })) {
            response.ignoreMatch();
          }
        }
        let m;
        const afterMatch = match.input.substring(afterMatchIndex);
        if (m = afterMatch.match(/^\s*=/)) {
          response.ignoreMatch();
          return;
        }
        if (m = afterMatch.match(/^\s+extends\s+/)) {
          if (m.index === 0) {
            response.ignoreMatch();
            return;
          }
        }
      }
    };
    const KEYWORDS$1 = {
      $pattern: IDENT_RE,
      keyword: KEYWORDS,
      literal: LITERALS,
      built_in: BUILT_INS,
      "variable.language": BUILT_IN_VARIABLES
    };
    const decimalDigits2 = "[0-9](_?[0-9])*";
    const frac2 = `\\.(${decimalDigits2})`;
    const decimalInteger = `0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*`;
    const NUMBER = {
      className: "number",
      variants: [
        // DecimalLiteral
        { begin: `(\\b(${decimalInteger})((${frac2})|\\.)?|(${frac2}))[eE][+-]?(${decimalDigits2})\\b` },
        { begin: `\\b(${decimalInteger})\\b((${frac2})\\b|\\.)?|(${frac2})\\b` },
        // DecimalBigIntegerLiteral
        { begin: `\\b(0|[1-9](_?[0-9])*)n\\b` },
        // NonDecimalIntegerLiteral
        { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
        { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
        { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
        // LegacyOctalIntegerLiteral (does not include underscore separators)
        // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
        { begin: "\\b0[0-7]+n?\\b" }
      ],
      relevance: 0
    };
    const SUBST = {
      className: "subst",
      begin: "\\$\\{",
      end: "\\}",
      keywords: KEYWORDS$1,
      contains: []
      // defined later
    };
    const HTML_TEMPLATE = {
      begin: ".?html`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "xml"
      }
    };
    const CSS_TEMPLATE = {
      begin: ".?css`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "css"
      }
    };
    const GRAPHQL_TEMPLATE = {
      begin: ".?gql`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "graphql"
      }
    };
    const TEMPLATE_STRING = {
      className: "string",
      begin: "`",
      end: "`",
      contains: [
        hljs.BACKSLASH_ESCAPE,
        SUBST
      ]
    };
    const JSDOC_COMMENT = hljs.COMMENT(
      /\/\*\*(?!\/)/,
      "\\*/",
      {
        relevance: 0,
        contains: [
          {
            begin: "(?=@[A-Za-z]+)",
            relevance: 0,
            contains: [
              {
                className: "doctag",
                begin: "@[A-Za-z]+"
              },
              {
                className: "type",
                begin: "\\{",
                end: "\\}",
                excludeEnd: true,
                excludeBegin: true,
                relevance: 0
              },
              {
                className: "variable",
                begin: IDENT_RE$1 + "(?=\\s*(-)|$)",
                endsParent: true,
                relevance: 0
              },
              // eat spaces (not newlines) so we can find
              // types or variables
              {
                begin: /(?=[^\n])\s/,
                relevance: 0
              }
            ]
          }
        ]
      }
    );
    const COMMENT = {
      className: "comment",
      variants: [
        JSDOC_COMMENT,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.C_LINE_COMMENT_MODE
      ]
    };
    const SUBST_INTERNALS = [
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      HTML_TEMPLATE,
      CSS_TEMPLATE,
      GRAPHQL_TEMPLATE,
      TEMPLATE_STRING,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      NUMBER
      // This is intentional:
      // See https://github.com/highlightjs/highlight.js/issues/3288
      // hljs.REGEXP_MODE
    ];
    SUBST.contains = SUBST_INTERNALS.concat({
      // we need to pair up {} inside our subst to prevent
      // it from ending too early by matching another }
      begin: /\{/,
      end: /\}/,
      keywords: KEYWORDS$1,
      contains: [
        "self"
      ].concat(SUBST_INTERNALS)
    });
    const SUBST_AND_COMMENTS = [].concat(COMMENT, SUBST.contains);
    const PARAMS_CONTAINS = SUBST_AND_COMMENTS.concat([
      // eat recursive parens in sub expressions
      {
        begin: /(\s*)\(/,
        end: /\)/,
        keywords: KEYWORDS$1,
        contains: ["self"].concat(SUBST_AND_COMMENTS)
      }
    ]);
    const PARAMS = {
      className: "params",
      // convert this to negative lookbehind in v12
      begin: /(\s*)\(/,
      // to match the parms with
      end: /\)/,
      excludeBegin: true,
      excludeEnd: true,
      keywords: KEYWORDS$1,
      contains: PARAMS_CONTAINS
    };
    const CLASS_OR_EXTENDS = {
      variants: [
        // class Car extends vehicle
        {
          match: [
            /class/,
            /\s+/,
            IDENT_RE$1,
            /\s+/,
            /extends/,
            /\s+/,
            regex.concat(IDENT_RE$1, "(", regex.concat(/\./, IDENT_RE$1), ")*")
          ],
          scope: {
            1: "keyword",
            3: "title.class",
            5: "keyword",
            7: "title.class.inherited"
          }
        },
        // class Car
        {
          match: [
            /class/,
            /\s+/,
            IDENT_RE$1
          ],
          scope: {
            1: "keyword",
            3: "title.class"
          }
        }
      ]
    };
    const CLASS_REFERENCE = {
      relevance: 0,
      match: regex.either(
        // Hard coded exceptions
        /\bJSON/,
        // Float32Array, OutT
        /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
        // CSSFactory, CSSFactoryT
        /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
        // FPs, FPsT
        /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/
        // P
        // single letters are not highlighted
        // BLAH
        // this will be flagged as a UPPER_CASE_CONSTANT instead
      ),
      className: "title.class",
      keywords: {
        _: [
          // se we still get relevance credit for JS library classes
          ...TYPES,
          ...ERROR_TYPES
        ]
      }
    };
    const USE_STRICT = {
      label: "use_strict",
      className: "meta",
      relevance: 10,
      begin: /^\s*['"]use (strict|asm)['"]/
    };
    const FUNCTION_DEFINITION = {
      variants: [
        {
          match: [
            /function/,
            /\s+/,
            IDENT_RE$1,
            /(?=\s*\()/
          ]
        },
        // anonymous function
        {
          match: [
            /function/,
            /\s*(?=\()/
          ]
        }
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      label: "func.def",
      contains: [PARAMS],
      illegal: /%/
    };
    const UPPER_CASE_CONSTANT = {
      relevance: 0,
      match: /\b[A-Z][A-Z_0-9]+\b/,
      className: "variable.constant"
    };
    function noneOf(list) {
      return regex.concat("(?!", list.join("|"), ")");
    }
    const FUNCTION_CALL = {
      match: regex.concat(
        /\b/,
        noneOf([
          ...BUILT_IN_GLOBALS,
          "super",
          "import"
        ].map((x) => `${x}\\s*\\(`)),
        IDENT_RE$1,
        regex.lookahead(/\s*\(/)
      ),
      className: "title.function",
      relevance: 0
    };
    const PROPERTY_ACCESS = {
      begin: regex.concat(/\./, regex.lookahead(
        regex.concat(IDENT_RE$1, /(?![0-9A-Za-z$_(])/)
      )),
      end: IDENT_RE$1,
      excludeBegin: true,
      keywords: "prototype",
      className: "property",
      relevance: 0
    };
    const GETTER_OR_SETTER = {
      match: [
        /get|set/,
        /\s+/,
        IDENT_RE$1,
        /(?=\()/
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        {
          // eat to avoid empty params
          begin: /\(\)/
        },
        PARAMS
      ]
    };
    const FUNC_LEAD_IN_RE = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + hljs.UNDERSCORE_IDENT_RE + ")\\s*=>";
    const FUNCTION_VARIABLE = {
      match: [
        /const|var|let/,
        /\s+/,
        IDENT_RE$1,
        /\s*/,
        /=\s*/,
        /(async\s*)?/,
        // async is optional
        regex.lookahead(FUNC_LEAD_IN_RE)
      ],
      keywords: "async",
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        PARAMS
      ]
    };
    return {
      name: "JavaScript",
      aliases: ["js", "jsx", "mjs", "cjs"],
      keywords: KEYWORDS$1,
      // this will be extended by TypeScript
      exports: { PARAMS_CONTAINS, CLASS_REFERENCE },
      illegal: /#(?![$_A-z])/,
      contains: [
        hljs.SHEBANG({
          label: "shebang",
          binary: "node",
          relevance: 5
        }),
        USE_STRICT,
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE,
        HTML_TEMPLATE,
        CSS_TEMPLATE,
        GRAPHQL_TEMPLATE,
        TEMPLATE_STRING,
        COMMENT,
        // Skip numbers when they are part of a variable name
        { match: /\$\d+/ },
        NUMBER,
        CLASS_REFERENCE,
        {
          scope: "attr",
          match: IDENT_RE$1 + regex.lookahead(":"),
          relevance: 0
        },
        FUNCTION_VARIABLE,
        {
          // "value" container
          begin: "(" + hljs.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
          keywords: "return throw case",
          relevance: 0,
          contains: [
            COMMENT,
            hljs.REGEXP_MODE,
            {
              className: "function",
              // we have to count the parens to make sure we actually have the
              // correct bounding ( ) before the =>.  There could be any number of
              // sub-expressions inside also surrounded by parens.
              begin: FUNC_LEAD_IN_RE,
              returnBegin: true,
              end: "\\s*=>",
              contains: [
                {
                  className: "params",
                  variants: [
                    {
                      begin: hljs.UNDERSCORE_IDENT_RE,
                      relevance: 0
                    },
                    {
                      className: null,
                      begin: /\(\s*\)/,
                      skip: true
                    },
                    {
                      begin: /(\s*)\(/,
                      end: /\)/,
                      excludeBegin: true,
                      excludeEnd: true,
                      keywords: KEYWORDS$1,
                      contains: PARAMS_CONTAINS
                    }
                  ]
                }
              ]
            },
            {
              // could be a comma delimited list of params to a function call
              begin: /,/,
              relevance: 0
            },
            {
              match: /\s+/,
              relevance: 0
            },
            {
              // JSX
              variants: [
                { begin: FRAGMENT.begin, end: FRAGMENT.end },
                { match: XML_SELF_CLOSING },
                {
                  begin: XML_TAG.begin,
                  // we carefully check the opening tag to see if it truly
                  // is a tag and not a false positive
                  "on:begin": XML_TAG.isTrulyOpeningTag,
                  end: XML_TAG.end
                }
              ],
              subLanguage: "xml",
              contains: [
                {
                  begin: XML_TAG.begin,
                  end: XML_TAG.end,
                  skip: true,
                  contains: ["self"]
                }
              ]
            }
          ]
        },
        FUNCTION_DEFINITION,
        {
          // prevent this from getting swallowed up by function
          // since they appear "function like"
          beginKeywords: "while if switch catch for"
        },
        {
          // we have to count the parens to make sure we actually have the correct
          // bounding ( ).  There could be any number of sub-expressions inside
          // also surrounded by parens.
          begin: "\\b(?!function)" + hljs.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
          // end parens
          returnBegin: true,
          label: "func.def",
          contains: [
            PARAMS,
            hljs.inherit(hljs.TITLE_MODE, { begin: IDENT_RE$1, className: "title.function" })
          ]
        },
        // catch ... so it won't trigger the property rule below
        {
          match: /\.\.\./,
          relevance: 0
        },
        PROPERTY_ACCESS,
        // hack: prevents detection of keywords in some circumstances
        // .keyword()
        // $keyword = x
        {
          match: "\\$" + IDENT_RE$1,
          relevance: 0
        },
        {
          match: [/\bconstructor(?=\s*\()/],
          className: { 1: "title.function" },
          contains: [PARAMS]
        },
        FUNCTION_CALL,
        UPPER_CASE_CONSTANT,
        CLASS_OR_EXTENDS,
        GETTER_OR_SETTER,
        {
          match: /\$[(.]/
          // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/python.js
  function python(hljs) {
    const regex = hljs.regex;
    const IDENT_RE2 = /[\p{XID_Start}_]\p{XID_Continue}*/u;
    const RESERVED_WORDS = [
      "and",
      "as",
      "assert",
      "async",
      "await",
      "break",
      "case",
      "class",
      "continue",
      "def",
      "del",
      "elif",
      "else",
      "except",
      "finally",
      "for",
      "from",
      "global",
      "if",
      "import",
      "in",
      "is",
      "lambda",
      "match",
      "nonlocal|10",
      "not",
      "or",
      "pass",
      "raise",
      "return",
      "try",
      "while",
      "with",
      "yield"
    ];
    const BUILT_INS2 = [
      "__import__",
      "abs",
      "all",
      "any",
      "ascii",
      "bin",
      "bool",
      "breakpoint",
      "bytearray",
      "bytes",
      "callable",
      "chr",
      "classmethod",
      "compile",
      "complex",
      "delattr",
      "dict",
      "dir",
      "divmod",
      "enumerate",
      "eval",
      "exec",
      "filter",
      "float",
      "format",
      "frozenset",
      "getattr",
      "globals",
      "hasattr",
      "hash",
      "help",
      "hex",
      "id",
      "input",
      "int",
      "isinstance",
      "issubclass",
      "iter",
      "len",
      "list",
      "locals",
      "map",
      "max",
      "memoryview",
      "min",
      "next",
      "object",
      "oct",
      "open",
      "ord",
      "pow",
      "print",
      "property",
      "range",
      "repr",
      "reversed",
      "round",
      "set",
      "setattr",
      "slice",
      "sorted",
      "staticmethod",
      "str",
      "sum",
      "super",
      "tuple",
      "type",
      "vars",
      "zip"
    ];
    const LITERALS2 = [
      "__debug__",
      "Ellipsis",
      "False",
      "None",
      "NotImplemented",
      "True"
    ];
    const TYPES2 = [
      "Any",
      "Callable",
      "Coroutine",
      "Dict",
      "List",
      "Literal",
      "Generic",
      "Optional",
      "Sequence",
      "Set",
      "Tuple",
      "Type",
      "Union"
    ];
    const KEYWORDS2 = {
      $pattern: /[A-Za-z]\w+|__\w+__/,
      keyword: RESERVED_WORDS,
      built_in: BUILT_INS2,
      literal: LITERALS2,
      type: TYPES2
    };
    const PROMPT = {
      className: "meta",
      begin: /^(>>>|\.\.\.) /
    };
    const SUBST = {
      className: "subst",
      begin: /\{/,
      end: /\}/,
      keywords: KEYWORDS2,
      illegal: /#/
    };
    const LITERAL_BRACKET = {
      begin: /\{\{/,
      relevance: 0
    };
    const STRING = {
      className: "string",
      contains: [hljs.BACKSLASH_ESCAPE],
      variants: [
        {
          begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,
          end: /'''/,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            PROMPT
          ],
          relevance: 10
        },
        {
          begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,
          end: /"""/,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            PROMPT
          ],
          relevance: 10
        },
        {
          begin: /([fF][rR]|[rR][fF]|[fF])'''/,
          end: /'''/,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            PROMPT,
            LITERAL_BRACKET,
            SUBST
          ]
        },
        {
          begin: /([fF][rR]|[rR][fF]|[fF])"""/,
          end: /"""/,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            PROMPT,
            LITERAL_BRACKET,
            SUBST
          ]
        },
        {
          begin: /([uU]|[rR])'/,
          end: /'/,
          relevance: 10
        },
        {
          begin: /([uU]|[rR])"/,
          end: /"/,
          relevance: 10
        },
        {
          begin: /([bB]|[bB][rR]|[rR][bB])'/,
          end: /'/
        },
        {
          begin: /([bB]|[bB][rR]|[rR][bB])"/,
          end: /"/
        },
        {
          begin: /([fF][rR]|[rR][fF]|[fF])'/,
          end: /'/,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            LITERAL_BRACKET,
            SUBST
          ]
        },
        {
          begin: /([fF][rR]|[rR][fF]|[fF])"/,
          end: /"/,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            LITERAL_BRACKET,
            SUBST
          ]
        },
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE
      ]
    };
    const digitpart = "[0-9](_?[0-9])*";
    const pointfloat = `(\\b(${digitpart}))?\\.(${digitpart})|\\b(${digitpart})\\.`;
    const lookahead = `\\b|${RESERVED_WORDS.join("|")}`;
    const NUMBER = {
      className: "number",
      relevance: 0,
      variants: [
        // exponentfloat, pointfloat
        // https://docs.python.org/3.9/reference/lexical_analysis.html#floating-point-literals
        // optionally imaginary
        // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
        // Note: no leading \b because floats can start with a decimal point
        // and we don't want to mishandle e.g. `fn(.5)`,
        // no trailing \b for pointfloat because it can end with a decimal point
        // and we don't want to mishandle e.g. `0..hex()`; this should be safe
        // because both MUST contain a decimal point and so cannot be confused with
        // the interior part of an identifier
        {
          begin: `(\\b(${digitpart})|(${pointfloat}))[eE][+-]?(${digitpart})[jJ]?(?=${lookahead})`
        },
        {
          begin: `(${pointfloat})[jJ]?`
        },
        // decinteger, bininteger, octinteger, hexinteger
        // https://docs.python.org/3.9/reference/lexical_analysis.html#integer-literals
        // optionally "long" in Python 2
        // https://docs.python.org/2.7/reference/lexical_analysis.html#integer-and-long-integer-literals
        // decinteger is optionally imaginary
        // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
        {
          begin: `\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${lookahead})`
        },
        {
          begin: `\\b0[bB](_?[01])+[lL]?(?=${lookahead})`
        },
        {
          begin: `\\b0[oO](_?[0-7])+[lL]?(?=${lookahead})`
        },
        {
          begin: `\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${lookahead})`
        },
        // imagnumber (digitpart-based)
        // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
        {
          begin: `\\b(${digitpart})[jJ](?=${lookahead})`
        }
      ]
    };
    const COMMENT_TYPE = {
      className: "comment",
      begin: regex.lookahead(/# type:/),
      end: /$/,
      keywords: KEYWORDS2,
      contains: [
        {
          // prevent keywords from coloring `type`
          begin: /# type:/
        },
        // comment within a datatype comment includes no keywords
        {
          begin: /#/,
          end: /\b\B/,
          endsWithParent: true
        }
      ]
    };
    const PARAMS = {
      className: "params",
      variants: [
        // Exclude params in functions without params
        {
          className: "",
          begin: /\(\s*\)/,
          skip: true
        },
        {
          begin: /\(/,
          end: /\)/,
          excludeBegin: true,
          excludeEnd: true,
          keywords: KEYWORDS2,
          contains: [
            "self",
            PROMPT,
            NUMBER,
            STRING,
            hljs.HASH_COMMENT_MODE
          ]
        }
      ]
    };
    SUBST.contains = [
      STRING,
      NUMBER,
      PROMPT
    ];
    return {
      name: "Python",
      aliases: [
        "py",
        "gyp",
        "ipython"
      ],
      unicodeRegex: true,
      keywords: KEYWORDS2,
      illegal: /(<\/|\?)|=>/,
      contains: [
        PROMPT,
        NUMBER,
        {
          // very common convention
          scope: "variable.language",
          match: /\bself\b/
        },
        {
          // eat "if" prior to string so that it won't accidentally be
          // labeled as an f-string
          beginKeywords: "if",
          relevance: 0
        },
        { match: /\bor\b/, scope: "keyword" },
        STRING,
        COMMENT_TYPE,
        hljs.HASH_COMMENT_MODE,
        {
          match: [
            /\bdef/,
            /\s+/,
            IDENT_RE2
          ],
          scope: {
            1: "keyword",
            3: "title.function"
          },
          contains: [PARAMS]
        },
        {
          variants: [
            {
              match: [
                /\bclass/,
                /\s+/,
                IDENT_RE2,
                /\s*/,
                /\(\s*/,
                IDENT_RE2,
                /\s*\)/
              ]
            },
            {
              match: [
                /\bclass/,
                /\s+/,
                IDENT_RE2
              ]
            }
          ],
          scope: {
            1: "keyword",
            3: "title.class",
            6: "title.class.inherited"
          }
        },
        {
          className: "meta",
          begin: /^[\t ]*@/,
          end: /(?=#)|$/,
          contains: [
            NUMBER,
            PARAMS,
            STRING
          ]
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/go.js
  function go2(hljs) {
    const LITERALS2 = [
      "true",
      "false",
      "iota",
      "nil"
    ];
    const BUILT_INS2 = [
      "append",
      "cap",
      "close",
      "complex",
      "copy",
      "imag",
      "len",
      "make",
      "new",
      "panic",
      "print",
      "println",
      "real",
      "recover",
      "delete"
    ];
    const TYPES2 = [
      "bool",
      "byte",
      "complex64",
      "complex128",
      "error",
      "float32",
      "float64",
      "int8",
      "int16",
      "int32",
      "int64",
      "string",
      "uint8",
      "uint16",
      "uint32",
      "uint64",
      "int",
      "uint",
      "uintptr",
      "rune"
    ];
    const KWS = [
      "break",
      "case",
      "chan",
      "const",
      "continue",
      "default",
      "defer",
      "else",
      "fallthrough",
      "for",
      "func",
      "go",
      "goto",
      "if",
      "import",
      "interface",
      "map",
      "package",
      "range",
      "return",
      "select",
      "struct",
      "switch",
      "type",
      "var"
    ];
    const KEYWORDS2 = {
      keyword: KWS,
      type: TYPES2,
      literal: LITERALS2,
      built_in: BUILT_INS2
    };
    return {
      name: "Go",
      aliases: ["golang"],
      keywords: KEYWORDS2,
      illegal: "</",
      contains: [
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        {
          className: "string",
          variants: [
            hljs.QUOTE_STRING_MODE,
            hljs.APOS_STRING_MODE,
            {
              begin: "`",
              end: "`"
            }
          ]
        },
        {
          className: "number",
          variants: [
            {
              match: /-?\b0[xX]\.[a-fA-F0-9](_?[a-fA-F0-9])*[pP][+-]?\d(_?\d)*i?/,
              // hex without a present digit before . (making a digit afterwards required)
              relevance: 0
            },
            {
              match: /-?\b0[xX](_?[a-fA-F0-9])+((\.([a-fA-F0-9](_?[a-fA-F0-9])*)?)?[pP][+-]?\d(_?\d)*)?i?/,
              // hex with a present digit before . (making a digit afterwards optional)
              relevance: 0
            },
            {
              match: /-?\b0[oO](_?[0-7])*i?/,
              // leading 0o octal
              relevance: 0
            },
            {
              match: /-?\.\d(_?\d)*([eE][+-]?\d(_?\d)*)?i?/,
              // decimal without a present digit before . (making a digit afterwards required)
              relevance: 0
            },
            {
              match: /-?\b\d(_?\d)*(\.(\d(_?\d)*)?)?([eE][+-]?\d(_?\d)*)?i?/,
              // decimal with a present digit before . (making a digit afterwards optional)
              relevance: 0
            }
          ]
        },
        {
          begin: /:=/
          // relevance booster
        },
        {
          className: "function",
          beginKeywords: "func",
          end: "\\s*(\\{|$)",
          excludeEnd: true,
          contains: [
            hljs.TITLE_MODE,
            {
              className: "params",
              begin: /\(/,
              end: /\)/,
              endsParent: true,
              keywords: KEYWORDS2,
              illegal: /["']/
            }
          ]
        }
      ]
    };
  }

  // node_modules/highlight.js/es/languages/bash.js
  function bash(hljs) {
    const regex = hljs.regex;
    const VAR = {};
    const BRACED_VAR = {
      begin: /\$\{/,
      end: /\}/,
      contains: [
        "self",
        {
          begin: /:-/,
          contains: [VAR]
        }
        // default values
      ]
    };
    Object.assign(VAR, {
      className: "variable",
      variants: [
        { begin: regex.concat(
          /\$[\w\d#@][\w\d_]*/,
          // negative look-ahead tries to avoid matching patterns that are not
          // Perl at all like $ident$, @ident@, etc.
          `(?![\\w\\d])(?![$])`
        ) },
        BRACED_VAR
      ]
    });
    const SUBST = {
      className: "subst",
      begin: /\$\(/,
      end: /\)/,
      contains: [hljs.BACKSLASH_ESCAPE]
    };
    const COMMENT = hljs.inherit(
      hljs.COMMENT(),
      {
        match: [
          /(^|\s)/,
          /#.*$/
        ],
        scope: {
          2: "comment"
        }
      }
    );
    const HERE_DOC = {
      begin: /<<-?\s*(?=\w+)/,
      starts: { contains: [
        hljs.END_SAME_AS_BEGIN({
          begin: /(\w+)/,
          end: /(\w+)/,
          className: "string"
        })
      ] }
    };
    const QUOTE_STRING = {
      className: "string",
      begin: /"/,
      end: /"/,
      contains: [
        hljs.BACKSLASH_ESCAPE,
        VAR,
        SUBST
      ]
    };
    SUBST.contains.push(QUOTE_STRING);
    const ESCAPED_QUOTE = {
      match: /\\"/
    };
    const APOS_STRING = {
      className: "string",
      begin: /'/,
      end: /'/
    };
    const ESCAPED_APOS = {
      match: /\\'/
    };
    const ARITHMETIC = {
      begin: /\$?\(\(/,
      end: /\)\)/,
      contains: [
        {
          begin: /\d+#[0-9a-f]+/,
          className: "number"
        },
        hljs.NUMBER_MODE,
        VAR
      ]
    };
    const SH_LIKE_SHELLS = [
      "fish",
      "bash",
      "zsh",
      "sh",
      "csh",
      "ksh",
      "tcsh",
      "dash",
      "scsh"
    ];
    const KNOWN_SHEBANG = hljs.SHEBANG({
      binary: `(${SH_LIKE_SHELLS.join("|")})`,
      relevance: 10
    });
    const FUNCTION = {
      className: "function",
      begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
      returnBegin: true,
      contains: [hljs.inherit(hljs.TITLE_MODE, { begin: /\w[\w\d_]*/ })],
      relevance: 0
    };
    const KEYWORDS2 = [
      "if",
      "then",
      "else",
      "elif",
      "fi",
      "time",
      "for",
      "while",
      "until",
      "in",
      "do",
      "done",
      "case",
      "esac",
      "coproc",
      "function",
      "select"
    ];
    const LITERALS2 = [
      "true",
      "false"
    ];
    const PATH_MODE = { match: /(\/[a-z._-]+)+/ };
    const SHELL_BUILT_INS = [
      "break",
      "cd",
      "continue",
      "eval",
      "exec",
      "exit",
      "export",
      "getopts",
      "hash",
      "pwd",
      "readonly",
      "return",
      "shift",
      "test",
      "times",
      "trap",
      "umask",
      "unset"
    ];
    const BASH_BUILT_INS = [
      "alias",
      "bind",
      "builtin",
      "caller",
      "command",
      "declare",
      "echo",
      "enable",
      "help",
      "let",
      "local",
      "logout",
      "mapfile",
      "printf",
      "read",
      "readarray",
      "source",
      "sudo",
      "type",
      "typeset",
      "ulimit",
      "unalias"
    ];
    const ZSH_BUILT_INS = [
      "autoload",
      "bg",
      "bindkey",
      "bye",
      "cap",
      "chdir",
      "clone",
      "comparguments",
      "compcall",
      "compctl",
      "compdescribe",
      "compfiles",
      "compgroups",
      "compquote",
      "comptags",
      "comptry",
      "compvalues",
      "dirs",
      "disable",
      "disown",
      "echotc",
      "echoti",
      "emulate",
      "fc",
      "fg",
      "float",
      "functions",
      "getcap",
      "getln",
      "history",
      "integer",
      "jobs",
      "kill",
      "limit",
      "log",
      "noglob",
      "popd",
      "print",
      "pushd",
      "pushln",
      "rehash",
      "sched",
      "setcap",
      "setopt",
      "stat",
      "suspend",
      "ttyctl",
      "unfunction",
      "unhash",
      "unlimit",
      "unsetopt",
      "vared",
      "wait",
      "whence",
      "where",
      "which",
      "zcompile",
      "zformat",
      "zftp",
      "zle",
      "zmodload",
      "zparseopts",
      "zprof",
      "zpty",
      "zregexparse",
      "zsocket",
      "zstyle",
      "ztcp"
    ];
    const GNU_CORE_UTILS = [
      "chcon",
      "chgrp",
      "chown",
      "chmod",
      "cp",
      "dd",
      "df",
      "dir",
      "dircolors",
      "ln",
      "ls",
      "mkdir",
      "mkfifo",
      "mknod",
      "mktemp",
      "mv",
      "realpath",
      "rm",
      "rmdir",
      "shred",
      "sync",
      "touch",
      "truncate",
      "vdir",
      "b2sum",
      "base32",
      "base64",
      "cat",
      "cksum",
      "comm",
      "csplit",
      "cut",
      "expand",
      "fmt",
      "fold",
      "head",
      "join",
      "md5sum",
      "nl",
      "numfmt",
      "od",
      "paste",
      "ptx",
      "pr",
      "sha1sum",
      "sha224sum",
      "sha256sum",
      "sha384sum",
      "sha512sum",
      "shuf",
      "sort",
      "split",
      "sum",
      "tac",
      "tail",
      "tr",
      "tsort",
      "unexpand",
      "uniq",
      "wc",
      "arch",
      "basename",
      "chroot",
      "date",
      "dirname",
      "du",
      "echo",
      "env",
      "expr",
      "factor",
      // "false", // keyword literal already
      "groups",
      "hostid",
      "id",
      "link",
      "logname",
      "nice",
      "nohup",
      "nproc",
      "pathchk",
      "pinky",
      "printenv",
      "printf",
      "pwd",
      "readlink",
      "runcon",
      "seq",
      "sleep",
      "stat",
      "stdbuf",
      "stty",
      "tee",
      "test",
      "timeout",
      // "true", // keyword literal already
      "tty",
      "uname",
      "unlink",
      "uptime",
      "users",
      "who",
      "whoami",
      "yes"
    ];
    return {
      name: "Bash",
      aliases: [
        "sh",
        "zsh"
      ],
      keywords: {
        $pattern: /\b[a-z][a-z0-9._-]+\b/,
        keyword: KEYWORDS2,
        literal: LITERALS2,
        built_in: [
          ...SHELL_BUILT_INS,
          ...BASH_BUILT_INS,
          // Shell modifiers
          "set",
          "shopt",
          ...ZSH_BUILT_INS,
          ...GNU_CORE_UTILS
        ]
      },
      contains: [
        KNOWN_SHEBANG,
        // to catch known shells and boost relevancy
        hljs.SHEBANG(),
        // to catch unknown shells but still highlight the shebang
        FUNCTION,
        ARITHMETIC,
        COMMENT,
        HERE_DOC,
        PATH_MODE,
        QUOTE_STRING,
        ESCAPED_QUOTE,
        APOS_STRING,
        ESCAPED_APOS,
        VAR
      ]
    };
  }

  // node_modules/highlight.js/es/languages/java.js
  var decimalDigits = "[0-9](_*[0-9])*";
  var frac = `\\.(${decimalDigits})`;
  var hexDigits = "[0-9a-fA-F](_*[0-9a-fA-F])*";
  var NUMERIC = {
    className: "number",
    variants: [
      // DecimalFloatingPointLiteral
      // including ExponentPart
      { begin: `(\\b(${decimalDigits})((${frac})|\\.)?|(${frac}))[eE][+-]?(${decimalDigits})[fFdD]?\\b` },
      // excluding ExponentPart
      { begin: `\\b(${decimalDigits})((${frac})[fFdD]?\\b|\\.([fFdD]\\b)?)` },
      { begin: `(${frac})[fFdD]?\\b` },
      { begin: `\\b(${decimalDigits})[fFdD]\\b` },
      // HexadecimalFloatingPointLiteral
      { begin: `\\b0[xX]((${hexDigits})\\.?|(${hexDigits})?\\.(${hexDigits}))[pP][+-]?(${decimalDigits})[fFdD]?\\b` },
      // DecimalIntegerLiteral
      { begin: "\\b(0|[1-9](_*[0-9])*)[lL]?\\b" },
      // HexIntegerLiteral
      { begin: `\\b0[xX](${hexDigits})[lL]?\\b` },
      // OctalIntegerLiteral
      { begin: "\\b0(_*[0-7])*[lL]?\\b" },
      // BinaryIntegerLiteral
      { begin: "\\b0[bB][01](_*[01])*[lL]?\\b" }
    ],
    relevance: 0
  };
  function recurRegex(re2, substitution, depth) {
    if (depth === -1) return "";
    return re2.replace(substitution, (_) => {
      return recurRegex(re2, substitution, depth - 1);
    });
  }
  function java(hljs) {
    const regex = hljs.regex;
    const JAVA_IDENT_RE = "[\xC0-\u02B8a-zA-Z_$][\xC0-\u02B8a-zA-Z_$0-9]*";
    const GENERIC_IDENT_RE = JAVA_IDENT_RE + recurRegex("(?:<" + JAVA_IDENT_RE + "~~~(?:\\s*,\\s*" + JAVA_IDENT_RE + "~~~)*>)?", /~~~/g, 2);
    const MAIN_KEYWORDS = [
      "synchronized",
      "abstract",
      "private",
      "var",
      "static",
      "if",
      "const ",
      "for",
      "while",
      "strictfp",
      "finally",
      "protected",
      "import",
      "native",
      "final",
      "void",
      "enum",
      "else",
      "break",
      "transient",
      "catch",
      "instanceof",
      "volatile",
      "case",
      "assert",
      "package",
      "default",
      "public",
      "try",
      "switch",
      "continue",
      "throws",
      "protected",
      "public",
      "private",
      "module",
      "requires",
      "exports",
      "do",
      "sealed",
      "yield",
      "permits",
      "goto",
      "when"
    ];
    const BUILT_INS2 = [
      "super",
      "this"
    ];
    const LITERALS2 = [
      "false",
      "true",
      "null"
    ];
    const TYPES2 = [
      "char",
      "boolean",
      "long",
      "float",
      "int",
      "byte",
      "short",
      "double"
    ];
    const KEYWORDS2 = {
      keyword: MAIN_KEYWORDS,
      literal: LITERALS2,
      type: TYPES2,
      built_in: BUILT_INS2
    };
    const ANNOTATION = {
      className: "meta",
      begin: "@" + JAVA_IDENT_RE,
      contains: [
        {
          begin: /\(/,
          end: /\)/,
          contains: ["self"]
          // allow nested () inside our annotation
        }
      ]
    };
    const PARAMS = {
      className: "params",
      begin: /\(/,
      end: /\)/,
      keywords: KEYWORDS2,
      relevance: 0,
      contains: [hljs.C_BLOCK_COMMENT_MODE],
      endsParent: true
    };
    return {
      name: "Java",
      aliases: ["jsp"],
      keywords: KEYWORDS2,
      illegal: /<\/|#/,
      contains: [
        hljs.COMMENT(
          "/\\*\\*",
          "\\*/",
          {
            relevance: 0,
            contains: [
              {
                // eat up @'s in emails to prevent them to be recognized as doctags
                begin: /\w+@/,
                relevance: 0
              },
              {
                className: "doctag",
                begin: "@[A-Za-z]+"
              }
            ]
          }
        ),
        // relevance boost
        {
          begin: /import java\.[a-z]+\./,
          keywords: "import",
          relevance: 2
        },
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        {
          begin: /"""/,
          end: /"""/,
          className: "string",
          contains: [hljs.BACKSLASH_ESCAPE]
        },
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE,
        {
          match: [
            /\b(?:class|interface|enum|extends|implements|new)/,
            /\s+/,
            JAVA_IDENT_RE
          ],
          className: {
            1: "keyword",
            3: "title.class"
          }
        },
        {
          // Exceptions for hyphenated keywords
          match: /non-sealed/,
          scope: "keyword"
        },
        {
          begin: [
            regex.concat(/(?!else)/, JAVA_IDENT_RE),
            /\s+/,
            JAVA_IDENT_RE,
            /\s+/,
            /=(?!=)/
          ],
          className: {
            1: "type",
            3: "variable",
            5: "operator"
          }
        },
        {
          begin: [
            /record/,
            /\s+/,
            JAVA_IDENT_RE
          ],
          className: {
            1: "keyword",
            3: "title.class"
          },
          contains: [
            PARAMS,
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE
          ]
        },
        {
          // Expression keywords prevent 'keyword Name(...)' from being
          // recognized as a function definition
          beginKeywords: "new throw return else",
          relevance: 0
        },
        {
          begin: [
            "(?:" + GENERIC_IDENT_RE + "\\s+)",
            hljs.UNDERSCORE_IDENT_RE,
            /\s*(?=\()/
          ],
          className: { 2: "title.function" },
          keywords: KEYWORDS2,
          contains: [
            {
              className: "params",
              begin: /\(/,
              end: /\)/,
              keywords: KEYWORDS2,
              relevance: 0,
              contains: [
                ANNOTATION,
                hljs.APOS_STRING_MODE,
                hljs.QUOTE_STRING_MODE,
                NUMERIC,
                hljs.C_BLOCK_COMMENT_MODE
              ]
            },
            hljs.C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE
          ]
        },
        NUMERIC,
        ANNOTATION
      ]
    };
  }

  // <stdin>
  core_default.registerLanguage("javascript", javascript);
  core_default.registerLanguage("js", javascript);
  core_default.registerLanguage("python", python);
  core_default.registerLanguage("go", go2);
  core_default.registerLanguage("bash", bash);
  core_default.registerLanguage("java", java);
  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
  function formatTopic(text) {
    text = text.replace(
      /!\[([^\]]*)\]\(([^)]+),.+,.+\)/g,
      '<img src="$2" alt="$1" style="vertical-align:middle;border-radius:3px;margin-left:6px;" />'
    );
    return text.replace(/`([^`]+)`/g, "<code>$1</code>");
  }
  function highlightCode(code, lang) {
    if (lang && core_default.getLanguage(lang)) {
      return core_default.highlight(code, { language: lang }).value;
    }
    return escapeHtml(code);
  }
  function parseMarkdownList(text) {
    const lines = text.split("\n");
    const root = { topic: "", children: [] };
    const stack = [{ node: root, indent: -1 }];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        i++;
        continue;
      }
      const match = line.match(/^(\s*)[*\-+]\s+(.*)/);
      if (!match) {
        i++;
        continue;
      }
      const indent = match[1].length;
      let topic = match[2].trim();
      let codeBlock = "";
      if (i + 1 < lines.length && lines[i + 1].trim().startsWith("```")) {
        i++;
        const langMatch = lines[i].trim().match(/^```(\w*)/);
        const lang = langMatch ? langMatch[1] : "";
        i++;
        let codeLines = [];
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        const nonEmptyLines = codeLines.filter((l) => l.trim().length > 0);
        const minIndent = nonEmptyLines.reduce((min, l) => {
          const spaces = l.match(/^(\s*)/)[1].length;
          return Math.min(min, spaces);
        }, Infinity);
        codeLines = codeLines.map((l) => l.slice(minIndent));
        codeBlock = codeLines.join("\n");
        const highlighted = highlightCode(codeBlock, lang);
        topic += `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
      }
      const node = { topic, children: [] };
      const imgMatch = text.match(/\!\[\]\(\s*([^,\]]+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*$/i);
      if (imgMatch) {
        const url = imgMatch[1].trim();
        const width = Number(imgMatch[2]);
        const height = Number(imgMatch[3]);
        text = text.replace(imgMatch[0], "").trim();
        node.topic = "";
        node.image = { url, width, height };
      }
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }
      stack[stack.length - 1].node.children.push(node);
      stack.push({ node, indent });
      i++;
    }
    if (root.children.length === 1) return root.children[0];
    root.topic = "Root";
    return root;
  }
  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function toMindElixirData(node) {
    return {
      topic: formatTopic(node.topic),
      id: generateId(),
      dangerouslySetInnerHTML: formatTopic(node.topic),
      children: (node.children || []).map((c) => toMindElixirData(c))
    };
  }
  function initMindmaps() {
    document.querySelectorAll(".mindmap-container").forEach((container) => {
      if (container.dataset.initialized) return;
      const raw = container.dataset.markdown;
      if (!raw) return;
      const observer = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          observer.disconnect();
          const tree = parseMarkdownList(raw);
          const data = { nodeData: toMindElixirData(tree) };
          const mind = new I({
            el: container,
            direction: 2,
            draggable: true,
            contextMenu: false,
            toolBar: false,
            nodeMenu: false,
            keypress: false
          });
          mind.init(data);
          mind.toCenter();
          container.dataset.initialized = "true";
        }
      });
      observer.observe(container);
    });
  }
  document.addEventListener("DOMContentLoaded", initMindmaps);
  window.addEventListener("load", initMindmaps);
})();
