;;; schema-markdown-mode-test.el --- Unit tests for schema-markdown-mode  -*- lexical-binding: t; -*-

;;; Commentary:

;; Run the tests (from the schema-markdown-js repository):
;;
;; make test-emacs
;; make test-emacs TEST=schema-markdown-test-tab

;;; Code:

(require 'ert)
(require 'schema-markdown-mode)


;;
;; Test helpers
;;

(defmacro schema-markdown-test-with-buffer (text &rest body)
  "Run BODY in a `schema-markdown-mode' buffer containing TEXT.
Point is placed at the \"|\" in TEXT (which is removed), or at the
beginning of the buffer."
  (declare (indent 1))
  ;; Inhibit messages - in batch mode, they (and each keyboard macro key's echo area clear) print to the
  ;; test output
  `(let ((buffer (generate-new-buffer "*schema-markdown-test*"))
         (inhibit-message t))
     (unwind-protect
         (progn
           ;; Keyboard macros execute in the selected window's buffer
           (switch-to-buffer buffer)
           (schema-markdown-mode)
           (setq-local indent-tabs-mode nil)
           (insert ,text)
           (goto-char (point-min))
           (when (search-forward "|" nil t)
             (delete-char -1))
           ,@body)
       (kill-buffer buffer))))

(defun schema-markdown-test-keys (keys)
  "Press KEYS (a `kbd' string) in the current buffer."
  (execute-kbd-macro (kbd keys)))

(defun schema-markdown-test-buffer ()
  "Return the current buffer's text with a \"|\" at point."
  (concat (buffer-substring-no-properties (point-min) (point))
          "|"
          (buffer-substring-no-properties (point) (point-max))))

(defun schema-markdown-test-type (keys)
  "Type KEYS (a string of characters) in a new buffer, one key at a time.
Return the buffer's text with a \"|\" at point."
  (schema-markdown-test-with-buffer ""
    (execute-kbd-macro keys)
    (schema-markdown-test-buffer)))

(defun schema-markdown-test-tab-indents (count)
  "Press TAB COUNT times, returning the line's indentation after each press."
  (let* (indents
         (record (lambda ()
                   (when (eq this-command 'schema-markdown-indent-line)
                     (push (current-indentation) indents)))))
    (add-hook 'post-command-hook record nil t)
    (unwind-protect
        (schema-markdown-test-keys (mapconcat #'identity (make-list count "TAB") " "))
      (remove-hook 'post-command-hook record t))
    (nreverse indents)))

(defun schema-markdown-test-face (text needle)
  "Return the face of the first occurrence of NEEDLE in fontified TEXT."
  (schema-markdown-test-with-buffer text
    (font-lock-ensure)
    (search-forward needle)
    (get-text-property (match-beginning 0) 'face)))

(defun schema-markdown-test-syntax (text needle)
  "Return the syntax state at the first occurrence of NEEDLE in TEXT."
  (schema-markdown-test-with-buffer text
    (search-forward needle)
    (syntax-ppss (match-beginning 0))))


;;
;; Mode setup
;;

(ert-deftest schema-markdown-test-auto-mode ()
  (should (eq (assoc-default "test.smd" auto-mode-alist #'string-match) 'schema-markdown-mode)))

(ert-deftest schema-markdown-test-key-bindings ()
  (schema-markdown-test-with-buffer ""
    (should (eq (key-binding (kbd "TAB")) 'schema-markdown-indent-line))
    (should (eq (key-binding (kbd "RET")) 'schema-markdown-newline-and-indent))
    (should (eq (key-binding (kbd "C-c C-l")) 'schema-markdown-open-language-documentation))))

(ert-deftest schema-markdown-test-open-language-documentation ()
  (cl-letf (((symbol-function 'browse-url) #'identity))
    (should (equal (schema-markdown-open-language-documentation)
                   "https://craigahobbs.github.io/schema-markdown-js/language/"))))


;;
;; Comments and strings
;;

(ert-deftest schema-markdown-test-comments ()
  ;; A "#" starts a comment only at the beginning of a line
  (should (nth 4 (schema-markdown-test-syntax "# Comment\n" "Comment")))
  (should (nth 4 (schema-markdown-test-syntax "struct A\n    # Comment\n" "Comment")))
  (should-not (nth 4 (schema-markdown-test-syntax "action a\n    urls\n        GET /a#b\n    query\n" "b\n")))
  (should-not (nth 4 (schema-markdown-test-syntax "action a\n    urls\n        GET /a#b\n    query\n" "query"))))

(ert-deftest schema-markdown-test-comment-faces ()
  ;; Documentation comments ("#") and other comments ("#-") are fontified differently
  (should (eq (schema-markdown-test-face "# The struct\nstruct A\n" "The") 'font-lock-doc-face))
  (should (eq (schema-markdown-test-face "#- Not documentation\nstruct A\n" "Not") 'font-lock-comment-face)))

(ert-deftest schema-markdown-test-strings ()
  (should (eq (schema-markdown-test-face "enum E\n    \"Value 1\"\n" "Value") 'font-lock-string-face))
  (should (eq (schema-markdown-test-face "group \"Stuff\"\n" "Stuff") 'font-lock-string-face)))

(ert-deftest schema-markdown-test-strings-no-escapes ()
  ;; A string ending with a backslash doesn't run on
  (should-not (nth 3 (schema-markdown-test-syntax "enum E\n    \"C:\\\"\n    B\n" "B"))))

(ert-deftest schema-markdown-test-strings-unclosed ()
  ;; An unclosed quote (e.g. while typing) doesn't make the rest of the buffer a string
  (should-not (nth 3 (schema-markdown-test-syntax "enum E\n    \"Value\n    B\nstruct S\n" "struct"))))

(ert-deftest schema-markdown-test-comment-region ()
  ;; Commenting out code doesn't make it documentation
  (schema-markdown-test-with-buffer "struct A\n    int a\n"
    (comment-region (point-min) (point-max))
    (should (equal (buffer-string) "#- struct A\n#-     int a\n"))
    (uncomment-region (point-min) (point-max))
    (should (equal (buffer-string) "struct A\n    int a\n"))))


;;
;; Font lock
;;

(ert-deftest schema-markdown-test-font-lock-definitions ()
  (should (eq (schema-markdown-test-face "struct MyStruct (Base1, Base2)\n" "struct") 'font-lock-keyword-face))
  (should (eq (schema-markdown-test-face "struct MyStruct (Base1, Base2)\n" "MyStruct") 'font-lock-type-face))
  (should (eq (schema-markdown-test-face "struct MyStruct (Base1, Base2)\n" "Base2") 'font-lock-type-face))
  (should (eq (schema-markdown-test-face "enum MyEnum\n" "MyEnum") 'font-lock-type-face))
  (should (eq (schema-markdown-test-face "typedef int(> 0) PositiveInt\n" "typedef") 'font-lock-keyword-face))
  (should (eq (schema-markdown-test-face "typedef int(> 0) PositiveInt\n" "PositiveInt") 'font-lock-type-face))
  (should (eq (schema-markdown-test-face "group \"Stuff\"\n" "group") 'font-lock-keyword-face)))

(ert-deftest schema-markdown-test-font-lock-members ()
  (should (eq (schema-markdown-test-face "struct S\n    optional int(> 0) count\n" "optional") 'font-lock-keyword-face))
  (should (eq (schema-markdown-test-face "struct S\n    optional int(> 0) count\n" "int") 'font-lock-type-face))
  (should (eq (schema-markdown-test-face "struct S\n    optional int(> 0) count\n" "count") 'font-lock-variable-name-face))
  (should (eq (schema-markdown-test-face "struct S\n    string(nullable, len > 0) a\n" "nullable") 'font-lock-builtin-face))
  (should (eq (schema-markdown-test-face "struct S\n    MyEnum : uuid{} values\n" "values") 'font-lock-variable-name-face)))

(ert-deftest schema-markdown-test-font-lock-member-names ()
  ;; Member names that are built-in type names or section keywords are member names
  (should (eq (schema-markdown-test-face "struct S\n    string date\n" "date") 'font-lock-variable-name-face))
  (should (eq (schema-markdown-test-face "struct S\n    string path\n" "path") 'font-lock-variable-name-face))
  (should-not (eq (schema-markdown-test-face "struct foo_struct\n" "struct\n") 'font-lock-keyword-face)))

(ert-deftest schema-markdown-test-font-lock-sections ()
  ;; Section keywords are only keywords within an action
  (should (eq (schema-markdown-test-face "action a\n    query (Base)\n        int a\n" "query") 'font-lock-keyword-face))
  (should (eq (schema-markdown-test-face "enum E\n    query\n" "query") 'font-lock-constant-face)))


;;
;; Indentation - typing with RET
;;

(ert-deftest schema-markdown-test-type-file ()
  ;; Typing a file with RET only - definitions are re-indented as they're typed
  (should (equal (schema-markdown-test-type
                  (concat "# A struct\r"
                          "struct S (Base)\r"
                          "# A member\r"
                          "optional int(> 0) a\r"
                          "string b\r"
                          "\r"
                          "enum E\r"
                          "A\r"
                          "\"B c\"\r"
                          "\r"
                          "typedef S[] Ss\r"
                          "\r"
                          "group \"API\"\r"
                          "action doIt\r"
                          "urls\r"
                          "GET /doIt\r"
                          "query (Base)\r"
                          "int c\r"
                          "errors\r"
                          "Bad\r"
                          "\r"
                          "group\r"))
                 (concat "# A struct\n"
                         "struct S (Base)\n"
                         "    # A member\n"
                         "    optional int(> 0) a\n"
                         "    string b\n"
                         "\n"
                         "enum E\n"
                         "    A\n"
                         "    \"B c\"\n"
                         "\n"
                         "typedef S[] Ss\n"
                         "\n"
                         "group \"API\"\n"
                         "action doIt\n"
                         "    urls\n"
                         "        GET /doIt\n"
                         "    query (Base)\n"
                         "        int c\n"
                         "    errors\n"
                         "        Bad\n"
                         "\n"
                         "        group\n"
                         "        |"))))

(ert-deftest schema-markdown-test-tab-group ()
  ;; A "group" line without a name is an enumeration value unless it's in column zero - TAB toggles it
  (schema-markdown-test-with-buffer "enum E\n    A\n    |group\n"
    (should (equal (schema-markdown-test-tab-indents 2) '(0 4)))))

(ert-deftest schema-markdown-test-type-continuation ()
  (should (equal (schema-markdown-test-type "struct S\rint(> 0, \\\r< 10) a\rint b")
                 "struct S\n    int(> 0, \\\n        < 10) a\n    int b|")))

(ert-deftest schema-markdown-test-type-enum-value-keywords ()
  ;; Enumeration values may be definition keywords
  (should (equal (schema-markdown-test-type "enum Permission\raction\rinput\rgroup")
                 "enum Permission\n    action\n    input\n    group|")))


;;
;; Indentation - TAB
;;

(ert-deftest schema-markdown-test-tab-to-expected ()
  (schema-markdown-test-with-buffer "struct S\n|int a\n"
    (should (equal (schema-markdown-test-tab-indents 1) '(4))))
  (schema-markdown-test-with-buffer "    |struct S\n"
    (should (equal (schema-markdown-test-tab-indents 1) '(0)))))

(ert-deftest schema-markdown-test-tab-cycle ()
  (schema-markdown-test-with-buffer "action a\n    query\n        |int a\n"
    (should (equal (schema-markdown-test-tab-indents 4) '(4 0 12 8)))))

(ert-deftest schema-markdown-test-tab-comment ()
  ;; A comment lines up with the code it documents
  (schema-markdown-test-with-buffer "struct S\n    int a\n    |# The next struct\nstruct T\n"
    (should (equal (schema-markdown-test-tab-indents 1) '(0))))
  (schema-markdown-test-with-buffer "struct S\n    int a\n|# The next member\n    int b\n"
    (should (equal (schema-markdown-test-tab-indents 1) '(4)))))

(ert-deftest schema-markdown-test-tab-point ()
  ;; Point keeps its position within the line's text
  (schema-markdown-test-with-buffer "struct S\nint |a\n"
    (schema-markdown-test-keys "TAB")
    (should (equal (schema-markdown-test-buffer) "struct S\n    int |a\n"))))

(ert-deftest schema-markdown-test-tab-indent-tabs-mode ()
  (schema-markdown-test-with-buffer "action a\n    query\n|int a\n"
    (setq-local indent-tabs-mode t)
    (setq-local tab-width 8)
    (should (equal (schema-markdown-test-tab-indents 3) '(8 4 0)))))

(ert-deftest schema-markdown-test-tab-region ()
  ;; TAB with an active region re-indents the region
  (schema-markdown-test-with-buffer "struct S\nint a\nenum E\n        A\n"
    (transient-mark-mode 1)
    (push-mark (point-max) t t)
    (schema-markdown-test-keys "TAB")
    (should (equal (buffer-string) "struct S\n    int a\nenum E\n    A\n"))))


;;
;; Indentation - indent-region
;;

(ert-deftest schema-markdown-test-indent-region ()
  ;; Re-indenting an unindented schema restores its indentation
  (let ((schema (concat "# Licensed under the MIT License\n"
                        "\n"
                        "group \"Types\"\n"
                        "\n"
                        "# A number pair\n"
                        "struct NumberPair\n"
                        "\n"
                        "    # The first number\n"
                        "    float first\n"
                        "\n"
                        "    #- Not documentation\n"
                        "    optional float(nullable) second\n"
                        "\n"
                        "typedef NumberPair[len > 0] NumberPairs\n"
                        "\n"
                        "enum Colors (BaseColors)\n"
                        "    Red\n"
                        "    \"Light Blue\"\n"
                        "\n"
                        "group\n"
                        "\n"
                        "# Sum the number pairs\n"
                        "action sumNumberPairs\n"
                        "    urls\n"
                        "        GET /sum/{name}\n"
                        "    path\n"
                        "        string name\n"
                        "    input (Base)\n"
                        "        # The number pairs\n"
                        "        NumberPairs pairs\n"
                        "    output\n"
                        "        float sum\n"
                        "    errors\n"
                        "        NegativeNumber\n")))
    (schema-markdown-test-with-buffer (replace-regexp-in-string "^ +" "" schema)
      (indent-region (point-min) (point-max))
      (should (equal (buffer-string) schema)))))

(provide 'schema-markdown-mode-test)

;;; schema-markdown-mode-test.el ends here
