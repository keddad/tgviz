pdflatex tz/tz.tex
pdflatex tz/tz.tex

pdflatex pz/pz.tex
pdflatex pz/pz.tex

pdflatex pmi/pmi.tex
pdflatex pmi/pmi.tex

rm *.toc *.out *.log *.aux

pdftk pz.pdf cat 2-end output pz_cut.pdf