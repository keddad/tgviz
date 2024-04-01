pdflatex tz/tz.tex
pdflatex tz/tz.tex

pdflatex pz/pz.tex
pdflatex pz/pz.tex

pdflatex pmi/pmi.tex
pdflatex pmi/pmi.tex

pdflatex ro/ro.tex
pdflatex ro/ro.tex

pdflatex tp/tp.tex
pdflatex tp/tp.tex

rm *.toc *.out *.log *.aux

pdftk pz.pdf cat 2-end output pz_cut.pdf
pdftk pz.pdf cat 1 output title.pdf