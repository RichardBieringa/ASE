FROM jupyter/scipy-notebook:lab-3.2.1

RUN conda install --quiet --yes pymongo && \
    conda clean --all -f -y && \
    fix-permissions "${CONDA_DIR}" && \
    fix-permissions "/home/${NB_USER}"
