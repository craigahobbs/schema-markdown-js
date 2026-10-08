;;; schema-markdown-mode.el --- Major mode for editing Schema Markdown files  -*- lexical-binding: t; -*-

;; Author: Craig A. Hobbs
;; URL: https://github.com/craigahobbs/schema-markdown-js
;; Version: 1.0
;; Package-Requires: ((emacs "24.4"))
;; Keywords: languages

;;; Commentary:

;; To install, add the following to your .emacs file:

;; (unless (package-installed-p 'schema-markdown-mode)
;;   (let ((mode-file (make-temp-file "schema-markdown-mode" nil ".el")))
;;     (url-copy-file "https://craigahobbs.github.io/schema-markdown-js/language/schema-markdown-mode.el" mode-file t)
;;     (package-install-file mode-file)
;;     (delete-file mode-file)))

;;; Code:

(defgroup schema-markdown nil
  "Major mode for editing Schema Markdown files."
  :group 'languages)

(defcustom schema-markdown-indent-offset 4
  "Number of columns for each Schema Markdown indentation level."
  :type 'integer
  :safe 'integerp)

(defconst schema-markdown--id-regexp "[A-Za-z][A-Za-z0-9_]*"
  "Regular expression matching a Schema Markdown identifier.")

(defconst schema-markdown--definition-regexp
  (concat "[ \t]*\\(?:\\(?:struct\\|union\\|enum\\|typedef\\|action\\)[ \t]+[A-Za-z]"
          "\\|group[ \t]+\"\\)")
  "Regular expression matching the start of a definition line.
Definitions (and documentation groups) must start in column zero.  A
\"group\" line without a group name is a definition only if it's in
column zero, since it may otherwise be an enumeration value.")

(defconst schema-markdown--section-regexp
  "[ \t]*\\(path\\|query\\|input\\|output\\|errors\\|urls\\)\\_>[ \t]*\\(?:(.*)[ \t]*\\)?$"
  "Regular expression matching an action section line.")

(defconst schema-markdown--builtin-types
  '("any" "bool" "date" "datetime" "float" "int" "string" "uuid")
  "The Schema Markdown built-in types.")

(defvar schema-markdown-mode-syntax-table
  (let ((table (make-syntax-table)))
    ;; Comments and strings are recognized by `schema-markdown--syntax-propertize', since a "#" only
    ;; starts a comment at the beginning of a line and strings don't span lines
    (modify-syntax-entry ?# "." table)
    (modify-syntax-entry ?\" "." table)
    (modify-syntax-entry ?\n ">" table)

    ;; Strings have no escape characters - a "\" at the end of a line is a line continuation
    (modify-syntax-entry ?\\ "." table)
    table)
  "Syntax table for `schema-markdown-mode'.")

(defvar schema-markdown-mode-map
  (let ((map (make-sparse-keymap)))
    (define-key map (kbd "TAB") 'schema-markdown-indent-line)
    (define-key map (kbd "RET") 'schema-markdown-newline-and-indent)
    (define-key map (kbd "C-c C-l") 'schema-markdown-open-language-documentation)
    map)
  "Keymap for `schema-markdown-mode'.")

(defun schema-markdown--syntax-propertize (start end)
  "Mark the comments and strings between START and END.
A \"#\" starts a comment only at the beginning of a line, and a string is
a pair of double quotes on the same line."
  (funcall
   (syntax-propertize-rules
    ("^[ \t]*\\(#\\)" (1 "<"))
    ("\\(\"\\)[^\"\n]*\\(\"\\)" (1 "\"") (2 "\"")))
   start end))

(defun schema-markdown--font-lock-syntactic-face (state)
  "Return the face of the comment or string described by syntax STATE.
Documentation comments (\"#\") use `font-lock-doc-face', and other
comments (\"#-\") use `font-lock-comment-face'."
  (cond ((nth 3 state) 'font-lock-string-face)
        ((eq (char-after (1+ (nth 8 state))) ?-) 'font-lock-comment-face)
        (t 'font-lock-doc-face)))

(defun schema-markdown--continued-line-p ()
  "Return non-nil if the current line ends with a \"\\\" line continuation."
  (save-excursion
    (beginning-of-line)
    (looking-at ".*\\\\[ \t]*$")))

(defun schema-markdown--previous-line-continued-p ()
  "Return non-nil if the previous line ends with a \"\\\" line continuation."
  (save-excursion
    (and (= (forward-line -1) 0)
         (schema-markdown--continued-line-p))))

(defun schema-markdown--definition-line-p ()
  "Return non-nil if the current line is a definition line."
  (save-excursion
    (beginning-of-line)
    (or (looking-at schema-markdown--definition-regexp)
        (looking-at "group[ \t]*$"))))

(defun schema-markdown--definition-keyword ()
  "Return the keyword of the definition containing the current line, or nil.
For example, \"struct\" for a struct member line."
  (save-excursion
    (beginning-of-line)
    (let (keyword)
      (while (and (not keyword) (= (forward-line -1) 0))
        (when (and (schema-markdown--definition-line-p)
                   (not (schema-markdown--previous-line-continued-p)))
          (looking-at "[ \t]*\\([a-z]+\\)")
          (setq keyword (match-string-no-properties 1))))
      keyword)))

(defun schema-markdown--expected-indentation ()
  "Return the expected indentation of the current line.
See `schema-markdown-mode' for the indentation rules."
  (save-excursion
    (beginning-of-line)
    (cond
     ;; A continuation line is indented one level past its first line
     ((schema-markdown--previous-line-continued-p)
      (forward-line -1)
      (while (schema-markdown--previous-line-continued-p)
        (forward-line -1))
      (+ (current-indentation) schema-markdown-indent-offset))

     ;; A comment lines up with the code it documents (the next code line)
     ((and (looking-at "[ \t]*#")
           (re-search-forward "^[ \t]*[^ \t\n#]" nil t))
      (schema-markdown--expected-indentation))

     ;; A definition is in column zero
     ((schema-markdown--definition-line-p)
      0)

     (t
      (let ((keyword (schema-markdown--definition-keyword)))
        (cond
         ;; Action sections are indented one level, and their contents two levels
         ((equal keyword "action")
          (if (looking-at schema-markdown--section-regexp)
              schema-markdown-indent-offset
            (* 2 schema-markdown-indent-offset)))

         ;; Struct, union, and enum contents are indented one level
         ((member keyword '("struct" "union" "enum"))
          schema-markdown-indent-offset)

         ;; Otherwise, column zero
         (t
          0)))))))

(defun schema-markdown--electric-indent-p (_char)
  "Return non-nil if the character just inserted should re-indent the line.
This is the case if it starts an indented definition's name (e.g. the
\"F\" of \"struct Foo\") or group name (the quote of \"group \\\"Foo\\\"\")."
  (and (> (current-indentation) 0)
       (looking-back (concat "^" schema-markdown--definition-regexp) (line-beginning-position))))

(defun schema-markdown-indent-line ()
  "Indent the current line to its expected indentation.
If the line is already at its expected indentation, or this command is
repeated, indent the line one level out instead, wrapping from column
zero to one level past the expected indentation.  If the region is
active, re-indent the region.  See `schema-markdown-mode' for the
indentation rules."
  (interactive)
  (if (use-region-p)
      (indent-region (region-beginning) (region-end))
    (let ((cur (current-indentation))
          (expected (schema-markdown--expected-indentation)))
      (schema-markdown--indent-line-to
       (cond ((not (or (= cur expected) (eq last-command 'schema-markdown-indent-line))) expected)
             ((= cur 0) (+ expected schema-markdown-indent-offset))
             (t (* schema-markdown-indent-offset (/ (1- cur) schema-markdown-indent-offset))))))))

(defun schema-markdown--indent-line ()
  "Indent the current line to its expected indentation.
This is the `indent-line-function', used by `indent-region' and electric
indentation.  Unlike `schema-markdown-indent-line', it never cycles."
  (schema-markdown--indent-line-to (schema-markdown--expected-indentation)))

(defun schema-markdown--indent-line-to (column)
  "Indent the current line to COLUMN, keeping point's position in its text."
  (let ((text-column (- (current-column) (current-indentation))))
    (indent-line-to column)
    (when (> text-column 0)
      (move-to-column (+ column text-column)))))

(defun schema-markdown-newline-and-indent ()
  "Insert a newline and indent the new line to its expected indentation.
The current line is first re-indented, unless it's a comment - a comment
lines up with the code it documents, which may not be typed yet."
  (interactive)
  (delete-horizontal-space t)
  (when (save-excursion (beginning-of-line) (looking-at "[ \t]*[^ \t\n#]"))
    (save-excursion (indent-line-to (schema-markdown--expected-indentation))))
  (newline)
  (indent-line-to (schema-markdown--expected-indentation)))

(defun schema-markdown-open-language-documentation ()
  "Open the Schema Markdown language documentation."
  (interactive)
  (browse-url "https://craigahobbs.github.io/schema-markdown-js/language/"))

(defun schema-markdown--section-matcher (limit)
  "Font-lock matcher for action section keywords before LIMIT."
  (let (found)
    (while (and (not found) (re-search-forward (concat "^" schema-markdown--section-regexp) limit t))
      (setq found (save-match-data (equal (schema-markdown--definition-keyword) "action"))))
    found))

(defconst schema-markdown-font-lock-keywords
  (let ((id schema-markdown--id-regexp))
    (list
     ;; Definitions - the keyword, the type name, and any base types
     `(,(concat "^\\(struct\\|union\\|enum\\|action\\)[ \t]+\\(" id "\\)")
       (1 'font-lock-keyword-face) (2 'font-lock-type-face)
       (,(concat "\\_<" id "\\_>") nil nil (0 'font-lock-type-face)))
     `(,(concat "^\\(typedef\\)\\_>.*?\\_<\\(" id "\\)[ \t]*$")
       (1 'font-lock-keyword-face) (2 'font-lock-type-face))
     '("^\\(group\\)\\_>" 1 'font-lock-keyword-face)

     ;; Action sections
     '(schema-markdown--section-matcher 1 'font-lock-keyword-face)

     ;; Enumeration values and URL methods - a single identifier on an indented line
     `(,(concat "^[ \t]+\\(" id "\\)[ \t]*$") 1 'font-lock-constant-face)

     ;; Members - the "optional" keyword and the member name (the last of two or more words)
     `(,(concat "^[ \t]+\\(optional\\)[ \t]+" id) 1 'font-lock-keyword-face)
     `(,(concat "^[ \t]+[A-Za-z].*[] \t)}]\\(" id "\\)[ \t]*$") 1 'font-lock-variable-name-face)

     ;; Built-in types and type attributes
     (cons (regexp-opt schema-markdown--builtin-types 'symbols) 'font-lock-type-face)
     '("\\_<\\(nullable\\|len\\)\\_>" 1 'font-lock-builtin-face)))
  "Font-lock rules for `schema-markdown-mode'.")

;;;###autoload
(define-derived-mode schema-markdown-mode prog-mode "Schema Markdown"
  "Major mode for editing Schema Markdown files.

Indentation:

- Definitions (\"struct\", \"union\", \"enum\", \"typedef\", \"action\", and
  \"group\") are in column zero.  Struct, union, and enum contents are
  indented one level.  Action sections are indented one level, and
  their contents two levels.  A comment lines up with the code it
  documents (the next code line).  A \"\\\" line continuation is indented
  one level.

- RET re-indents the current line (unless it's a comment) and indents
  the new line.  A definition is re-indented as it's typed.

- TAB indents the line.  If the line is already indented, or TAB is
  pressed again, it moves the line one level out, wrapping from column
  zero to one level past the line's indentation.

Comments starting with \"#\" are documentation for the next definition.
Comments starting with \"#-\" aren't, so commenting out code (e.g.
\\[comment-region]) uses them.

\\{schema-markdown-mode-map}"

  ;; Comments and strings
  (setq-local syntax-propertize-function 'schema-markdown--syntax-propertize)
  (setq-local comment-start "#- ")
  (setq-local comment-start-skip "#-?[ \t]*")
  (setq-local comment-auto-fill-only-comments t)

  ;; Indentation, re-indenting definitions as they're typed
  (setq-local indent-line-function 'schema-markdown--indent-line)
  (add-hook 'electric-indent-functions 'schema-markdown--electric-indent-p nil t)

  ;; Syntax highlighting
  (setq-local font-lock-defaults
              '(schema-markdown-font-lock-keywords
                nil nil nil nil
                (font-lock-syntactic-face-function . schema-markdown--font-lock-syntactic-face))))

;;;###autoload
(add-to-list 'auto-mode-alist '("\\.smd\\'" . schema-markdown-mode))

(provide 'schema-markdown-mode)

;;; schema-markdown-mode.el ends here
