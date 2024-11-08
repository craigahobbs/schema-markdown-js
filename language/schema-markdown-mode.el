;;; schema-markdown-mode.el --- Major mode for editing Schema Markdown files

;; Version: 0.3

;;; Commentary:

;; To install, add the following to your .emacs file:

;; (package-initialize)
;;
;; (unless (package-installed-p 'schema-markdown-mode)
;;   (let ((mode-file (make-temp-file "schema-markdown-mode")))
;;     (url-copy-file "https://craigahobbs.github.io/schema-markdown-js/language/schema-markdown-mode.el" mode-file t)
;;     (package-install-file mode-file)
;;     (delete-file mode-file)))
;; (add-to-list 'auto-mode-alist '("\\.smd\\'" . schema-markdown-mode))

;;; Code:

(defconst schema-markdown-keywords
  (regexp-opt
   '("action" "enum" "errors" "group" "input" "nullable" "optional" "output"
      "path" "query" "struct" "typedef" "union" "urls")
   'words)
  )

(defconst schema-markdown-types
  (regexp-opt
   '("any" "bool" "date" "datetime" "float" "int" "string" "uuid")
   'words)
  )

(defconst schema-markdown-font-lock-keywords
  (list
   (cons schema-markdown-keywords 'font-lock-keyword-face)
   (cons schema-markdown-types 'font-lock-type-face)

   ;; Rule for variable assignment highlighting
   '("^\\s-*\\([_A-Za-z][_A-Za-z0-9]*\\)\\s-*=" 1 'font-lock-variable-name-face)

   ;; Rule for label highlighting
   '("^\\s-*\\([_A-Za-z][_A-Za-z0-9]*\\)\\s-*:\\s-*$" 1 'font-lock-constant-face)
   )
  )

(defun schema-markdown-open-language-documentation ()
  "Open Schema Markdown language documentation"
  (interactive)
  (browse-url "https://craigahobbs.github.io/schema-markdown-js/language/")
  )

;;;###autoload
(define-derived-mode schema-markdown-mode prog-mode "Schema Markdown"
  "Major mode for editing Schema Markdown files"

  ; Ensure double quotes are treated as string delimiters
  (modify-syntax-entry ?\" "\"" schema-markdown-mode-syntax-table)

  ; Ensure backslashes are treated as escape characters
  (modify-syntax-entry ?\\ "\\" schema-markdown-mode-syntax-table)

  ; Specify that comments start with '#'
  (modify-syntax-entry ?# "<" schema-markdown-mode-syntax-table)

  ; Specify that comments end with a newline
  (modify-syntax-entry ?\n ">" schema-markdown-mode-syntax-table)

  ;; Set comment-related variables
  (setq-local comment-start "#")
  (setq-local comment-start-skip "#+\\s-*")

  ;; Apply font-lock rules for syntax highlighting
  (setq-local font-lock-defaults '(schema-markdown-font-lock-keywords))

  ;; Bind the key for browsing documentation
  (define-key schema-markdown-mode-map (kbd "C-c C-l") 'schema-markdown-open-language-documentation)
  )

(provide 'schema-markdown-mode)

;;; schema-markdown-mode.el ends here
