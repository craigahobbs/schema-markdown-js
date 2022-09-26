;;; schema-markdown-mode.el --- major mode for editing Schema Markdown

;; Version: 0.1

;;; Commentary:

;; To install, add the following to your .emacs file:

;; (package-initialize)
;;
;; (unless (package-installed-p 'schema-markdown-mode)
;;   (let ((mode-file (make-temp-file "schema-markdown-mode")))
;;     (url-copy-file "https://craigahobbs.github.io/schema-markdown-js/language/schema-markdown-mode.el" mode-file t)
;;     (package-install-file mode-file)
;;     (delete-file mode-file)))

;;; Code:
(require 'generic-x)

;;;###autoload
(defun define-schema-markdown-mode()
  (define-generic-mode 'schema-markdown-mode
    '(?#)
    '(
      "action"
      "enum"
      "errors"
      "group"
      "input"
      "nullable"
      "optional"
      "output"
      "path"
      "query"
      "struct"
      "typedef"
      "union"
      "urls"
      )
    (list
     (cons
      (regexp-opt
       '(
         "bool"
         "date"
         "datetime"
         "float"
         "int"
         "object"
         "string"
         "uuid"
         ) 'words) 'font-lock-type-face)
     )
    '("\\.smd\\'")
    nil
    "Major mode for editing Schema Markdown"))

;;;###autoload
(define-schema-markdown-mode)

(provide 'schema-markdown-mode)
;;; schema-markdown-mode.el ends here
