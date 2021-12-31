rm -rf ../docs/*;
tail -n +5 ../README.md > index.md
# node --inspect-brk ../node_modules/docco-next/bin/docco \


../node_modules/docco-next/bin/docco \
  -c docco.css\
  -t docco.ejs\
  -o ../docs\
 index.md\
 code.js

cp -r ./images ../docs/
